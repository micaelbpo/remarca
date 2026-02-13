import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { authService } from '../services/auth/auth.service';
import { successResponse, validationError, unauthorizedError, internalError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';
import {
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  InvalidTokenError,
} from '../services/auth/types';

const logger = createLogger('AuthHandlers');

/**
 * Register a new user
 * POST /auth/register
 */
export const register = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Register request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const input = JSON.parse(event.body);

    // Validate required fields
    if (!input.email || !input.password || !input.name || !input.tenantId || !input.userType) {
      return validationError('email, password, name, tenantId, and userType are required');
    }

    // Validate userType
    if (!['ADMIN', 'PROFESSIONAL', 'PATIENT'].includes(input.userType)) {
      return validationError('userType must be ADMIN, PROFESSIONAL, or PATIENT');
    }

    const result = await authService.register(input);

    return successResponse(
      {
        message: 'User registered successfully',
        userId: result.userId,
        email: result.email,
      },
      201
    );
  } catch (error: any) {
    logger.error('Error registering user', { error, message: error?.message, name: error?.name });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    if (error instanceof AuthenticationError) {
      return validationError(error.message);
    }

    // Cognito specific errors
    if (error.name === 'UsernameExistsException') {
      return validationError('Email already registered');
    }

    if (error.name === 'InvalidPasswordException') {
      return validationError('Password does not meet requirements: minimum 8 characters, uppercase, lowercase, and numbers');
    }

    if (error.name === 'InvalidParameterException') {
      return validationError(`Invalid parameter: ${error.message}`);
    }

    // Return detailed error in development
    return validationError(error.message || 'Failed to register user');
  }
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Login request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const input = JSON.parse(event.body);

    // Validate required fields
    if (!input.email || !input.password) {
      return validationError('email and password are required');
    }

    const tokens = await authService.login(input);

    return successResponse({
      message: 'Login successful',
      ...tokens,
    });
  } catch (error) {
    logger.error('Error logging in', { error });

    if (error instanceof AuthenticationError) {
      return unauthorizedError(error.message);
    }

    return internalError();
  }
};

/**
 * Validate token
 * GET /auth/validate
 */
export const validate = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Validate token request', { path: event.rawPath });

    // Get token from Authorization header
    const authHeader = event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader) {
      return unauthorizedError('Authorization header is required');
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return unauthorizedError('Token is required');
    }

    const payload = await authService.validateToken(token);

    return successResponse({
      valid: true,
      userId: payload.userId,
      tenantId: payload.tenantId,
      userType: payload.userType,
      email: payload.email,
    });
  } catch (error) {
    logger.error('Error validating token', { error });

    if (error instanceof TokenExpiredError) {
      return unauthorizedError('Token has expired');
    }

    if (error instanceof InvalidTokenError) {
      return unauthorizedError('Invalid token');
    }

    if (error instanceof AuthorizationError) {
      return unauthorizedError(error.message);
    }

    return internalError();
  }
};

/**
 * Refresh token
 * POST /auth/refresh
 */
export const refresh = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Refresh token request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const { refreshToken } = JSON.parse(event.body);

    if (!refreshToken) {
      return validationError('refreshToken is required');
    }

    // TODO: Implement refresh token logic with Cognito
    // For now, return a placeholder response
    return successResponse({
      message: 'Token refresh not yet implemented',
    });
  } catch (error) {
    logger.error('Error refreshing token', { error });

    return internalError();
  }
};
