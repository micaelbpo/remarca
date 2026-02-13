import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  ConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createLogger } from '../../shared/utils/logger';
import { validateEmail, ValidationError } from '../../shared/utils/validation';
import { UserType, AuthToken, TokenPayload } from '../../shared/types';
import {
  AuthServiceInterface,
  RegisterInput,
  LoginInput,
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  InvalidTokenError,
  PERMISSIONS,
} from './types';

const logger = createLogger('AuthService');

export class AuthService implements AuthServiceInterface {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jwtVerifier: any;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
    this.clientId = process.env.COGNITO_CLIENT_ID!;

    // Initialize JWT verifier
    this.jwtVerifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: 'access',
      clientId: this.clientId,
    });

    if (!this.userPoolId || !this.clientId) {
      throw new Error('Cognito configuration missing');
    }
  }

  /**
   * Register a new user in Cognito
   * Validates: Requirements 1.1, 1.2
   */
  async register(input: RegisterInput): Promise<{ userId: string; email: string }> {
    logger.info('Registering new user', { email: input.email, userType: input.userType });

    // Validate email format
    if (!validateEmail(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    try {
      // Create user in Cognito (only standard attributes)
      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'name', Value: input.name },
        ],
      });

      const response = await this.cognitoClient.send(signUpCommand);

      logger.info('User registered successfully in Cognito', { userId: response.UserSub });

      // Store additional user info in DynamoDB
      const dynamoRepository = new (await import('../../repositories/dynamodb.repository')).DynamoDBRepository();
      
      const userProfile: Record<string, any> = {
        PK: `USER#${response.UserSub}`,
        SK: `PROFILE`,
        id: response.UserSub!,
        email: input.email,
        name: input.name,
        tenantId: input.tenantId,
        userType: input.userType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only add phone if provided
      if (input.phone) {
        userProfile.phone = input.phone;
      }
      
      await dynamoRepository.put(userProfile);

      logger.info('User profile stored in DynamoDB', { userId: response.UserSub });

      return {
        userId: response.UserSub!,
        email: input.email,
      };
    } catch (error: unknown) {
      logger.error('Failed to register user', error, { email: input.email });

      // Check if it's a RepositoryError (DynamoDB error)
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message: string; name?: string };
        if (err.message?.includes('Failed to put item')) {
          throw new ValidationError(err.message);
        }
      }

      if (error && typeof error === 'object' && 'name' in error) {
        const cognitoError = error as { name: string; message?: string };
        
        if (cognitoError.name === 'UsernameExistsException') {
          throw new AuthenticationError('Email already registered');
        }

        if (cognitoError.name === 'InvalidPasswordException') {
          throw new ValidationError('Password does not meet requirements: minimum 8 characters, uppercase, lowercase, and numbers');
        }

        if (cognitoError.name === 'InvalidParameterException') {
          throw new ValidationError(`Invalid parameter: ${cognitoError.message || 'Check your input'}`);
        }

        // Log and throw the actual Cognito error message
        logger.error('Cognito error', { name: cognitoError.name, message: cognitoError.message });
        throw new AuthenticationError(cognitoError.message || `Cognito error: ${cognitoError.name}`);
      }

      throw new AuthenticationError('Failed to register user');
    }
  }

  /**
   * Confirm user email with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    logger.info('Confirming user signup', { email });

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      });

      await this.cognitoClient.send(command);
      logger.info('User confirmed successfully', { email });
    } catch (error: unknown) {
      logger.error('Failed to confirm user', error, { email });

      if (error && typeof error === 'object' && 'name' in error) {
        const cognitoError = error as { name: string; message?: string };
        
        if (cognitoError.name === 'CodeMismatchException') {
          throw new ValidationError('Invalid verification code');
        }
        
        if (cognitoError.name === 'ExpiredCodeException') {
          throw new ValidationError('Verification code has expired');
        }

        throw new ValidationError(cognitoError.message || 'Failed to confirm user');
      }

      throw new ValidationError('Failed to confirm user');
    }
  }

  /**
   * Authenticate user and return JWT tokens
   * Validates: Requirements 1.1, 1.2
   */
  async login(input: LoginInput): Promise<AuthToken> {
    logger.info('User login attempt', { email: input.email });

    try {
      const authCommand = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      });

      const response = await this.cognitoClient.send(authCommand);

      if (!response.AuthenticationResult) {
        throw new AuthenticationError('Authentication failed');
      }

      logger.info('User logged in successfully', { email: input.email });

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error: unknown) {
      logger.error('Login failed', error, { email: input.email });

      if (error && typeof error === 'object' && 'name' in error) {
        const cognitoError = error as { name: string; message?: string };
        
        if (cognitoError.name === 'NotAuthorizedException') {
          throw new AuthenticationError('Invalid email or password');
        }
        
        if (cognitoError.name === 'UserNotFoundException') {
          throw new AuthenticationError('User not found');
        }
        
        if (cognitoError.name === 'UserNotConfirmedException') {
          throw new AuthenticationError('Email not confirmed. Please check your email for confirmation link.');
        }
        
        // Log and throw the actual error message
        logger.error('Cognito login error', { name: cognitoError.name, message: cognitoError.message });
        throw new AuthenticationError(cognitoError.message || `Login error: ${cognitoError.name}`);
      }

      throw new AuthenticationError('Login failed');
    }
  }

  /**
   * Validate JWT token and extract payload
   * Validates: Requirements 1.2
   */
  async validateToken(token: string): Promise<TokenPayload> {
    logger.debug('Validating token');

    try {
      const payload = await this.jwtVerifier.verify(token);

      const tokenPayload: TokenPayload = {
        userId: payload.sub,
        tenantId: payload['custom:tenantId'],
        userType: payload['custom:userType'] as UserType,
        email: payload.email,
      };

      logger.debug('Token validated successfully', { userId: tokenPayload.userId });

      return tokenPayload;
    } catch (error: unknown) {
      logger.error('Token validation failed', error);

      if (error && typeof error === 'object' && 'name' in error && error.name === 'JwtExpiredError') {
        throw new TokenExpiredError();
      }

      throw new InvalidTokenError();
    }
  }

  /**
   * Check if user has permission to perform action on resource
   * Validates: Requirements 1.4
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    userType?: UserType
  ): Promise<boolean> {
    logger.debug('Checking permission', { userId, resource, action });

    if (!userType) {
      // In real implementation, fetch user type from database or token
      logger.warn('UserType not provided, permission check may be incomplete');
      return false;
    }

    const userPermissions = PERMISSIONS[userType];

    const hasPermission = userPermissions.some(
      (perm) => perm.resource === resource && perm.actions.includes(action)
    );

    logger.debug('Permission check result', { userId, resource, action, hasPermission });

    return hasPermission;
  }

  /**
   * Verify user has permission or throw error
   * Validates: Requirements 1.4, 1.5
   */
  async requirePermission(
    userId: string,
    resource: string,
    action: string,
    userType: UserType
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, resource, action, userType);

    if (!hasPermission) {
      logger.warn('Permission denied', { userId, resource, action, userType });
      throw new AuthorizationError(
        `User does not have permission to ${action} ${resource}`
      );
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
