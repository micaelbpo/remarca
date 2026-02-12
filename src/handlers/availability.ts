import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { availabilityService } from '../services/availability/availability.service';
import { successResponse, validationError, internalError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';

const logger = createLogger('AvailabilityHandlers');

/**
 * Get available slots
 * GET /availability?professionalId=xxx&tenantId=xxx&productId=xxx&startDate=2024-01-01&endDate=2024-01-31
 */
export const getAvailableSlots = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.queryStringParameters?.professionalId;
    const tenantId = event.queryStringParameters?.tenantId;
    const productId = event.queryStringParameters?.productId;
    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;

    logger.info('Get available slots request', {
      professionalId,
      tenantId,
      productId,
      startDate,
      endDate,
    });

    if (!professionalId || !tenantId || !productId || !startDate || !endDate) {
      return validationError(
        'professionalId, tenantId, productId, startDate, and endDate are required'
      );
    }

    const slots = await availabilityService.getAvailableSlots({
      professionalId,
      tenantId,
      productId,
      startDate,
      endDate,
    });

    return successResponse({ slots, count: slots.length });
  } catch (error) {
    logger.error('Error getting available slots', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Check if a specific slot is available
 * GET /availability/check?professionalId=xxx&tenantId=xxx&productId=xxx&startDateTime=2024-01-01T10:00:00Z
 */
export const checkSlotAvailability = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.queryStringParameters?.professionalId;
    const tenantId = event.queryStringParameters?.tenantId;
    const productId = event.queryStringParameters?.productId;
    const startDateTime = event.queryStringParameters?.startDateTime;

    logger.info('Check slot availability request', {
      professionalId,
      tenantId,
      productId,
      startDateTime,
    });

    if (!professionalId || !tenantId || !productId || !startDateTime) {
      return validationError(
        'professionalId, tenantId, productId, and startDateTime are required'
      );
    }

    const available = await availabilityService.isSlotAvailable(
      professionalId,
      tenantId,
      productId,
      startDateTime
    );

    return successResponse({ available, startDateTime });
  } catch (error) {
    logger.error('Error checking slot availability', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};
