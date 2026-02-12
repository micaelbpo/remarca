import { ApiResponse, ErrorResponse } from '../types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export const successResponse = <T>(data: T, statusCode: number = 200): ApiResponse => {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
};

export const errorResponse = (
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): ApiResponse => {
  const errorBody: ErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(errorBody),
  };
};

export const validationError = (message: string, details?: any): ApiResponse => {
  return errorResponse('VALIDATION_ERROR', message, 400, details);
};

export const unauthorizedError = (message: string = 'Unauthorized'): ApiResponse => {
  return errorResponse('UNAUTHORIZED', message, 401);
};

export const forbiddenError = (message: string = 'Forbidden'): ApiResponse => {
  return errorResponse('FORBIDDEN', message, 403);
};

export const notFoundError = (message: string = 'Resource not found'): ApiResponse => {
  return errorResponse('NOT_FOUND', message, 404);
};

export const conflictError = (message: string, details?: any): ApiResponse => {
  return errorResponse('CONFLICT', message, 409, details);
};

export const internalError = (message: string = 'Internal server error'): ApiResponse => {
  return errorResponse('INTERNAL_ERROR', message, 500);
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
