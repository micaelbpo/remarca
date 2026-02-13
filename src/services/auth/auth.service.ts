import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
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
      // Create user in Cognito
      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'name', Value: input.name },
          { Name: 'custom:tenantId', Value: input.tenantId },
          { Name: 'custom:userType', Value: input.userType },
          ...(input.phone ? [{ Name: 'custom:phone', Value: input.phone }] : []),
        ],
      });

      const response = await this.cognitoClient.send(signUpCommand);

      logger.info('User registered successfully', { userId: response.UserSub });

      return {
        userId: response.UserSub!,
        email: input.email,
      };
    } catch (error: unknown) {
      logger.error('Failed to register user', error, { email: input.email });

      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'UsernameExistsException') {
          throw new AuthenticationError('Email already registered');
        }

        if (error.name === 'InvalidPasswordException') {
          throw new ValidationError('Password does not meet requirements');
        }
      }

      throw new AuthenticationError('Failed to register user');
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
        if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
          throw new AuthenticationError('Invalid email or password');
        }
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
