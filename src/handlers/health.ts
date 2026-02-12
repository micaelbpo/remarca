import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('HealthHandler');

/**
 * Health check endpoint
 * GET /health
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Health check requested', {
    requestId: event.requestContext.requestId,
  });

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Remarca API',
    version: '1.0.0',
    environment: process.env.STAGE || 'unknown',
    region: process.env.AWS_REGION || 'unknown',
  };

  return successResponse(healthData);
};
