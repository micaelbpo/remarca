import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { professionalService } from '../services/professional/professional.service';
import { successResponse, validationError, notFoundError, internalError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';
import { EntityNotFoundError } from '../repositories/types';

const logger = createLogger('ProfessionalHandlers');

/**
 * Create a new professional
 * POST /professionals
 */
export const createProfessional = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Create professional request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const input = JSON.parse(event.body);
    const professional = await professionalService.createProfessional(input);

    return successResponse(professional, 201);
  } catch (error) {
    logger.error('Error creating professional', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Get professional by ID
 * GET /professionals/{id}
 */
export const getProfessional = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Get professional request', { professionalId, tenantId });

    if (!professionalId || !tenantId) {
      return validationError('professionalId and tenantId are required');
    }

    const professional = await professionalService.getProfessional(professionalId, tenantId);

    return successResponse(professional);
  } catch (error) {
    logger.error('Error getting professional', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};

/**
 * Update professional
 * PUT /professionals/{id}
 */
export const updateProfessional = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Update professional request', { professionalId, tenantId });

    if (!professionalId || !tenantId) {
      return validationError('professionalId and tenantId are required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const updates = JSON.parse(event.body);
    const professional = await professionalService.updateProfessional(
      professionalId,
      tenantId,
      updates
    );

    return successResponse(professional);
  } catch (error) {
    logger.error('Error updating professional', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};

/**
 * Set professional availability
 * POST /professionals/{id}/availability
 */
export const setAvailability = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.pathParameters?.id;

    logger.info('Set availability request', { professionalId });

    if (!professionalId) {
      return validationError('professionalId is required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const availability = JSON.parse(event.body);
    await professionalService.setAvailability(professionalId, availability);

    return successResponse({ message: 'Availability set successfully' });
  } catch (error) {
    logger.error('Error setting availability', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Get professional availability
 * GET /professionals/{id}/availability
 */
export const getAvailability = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const professionalId = event.pathParameters?.id;

    logger.info('Get availability request', { professionalId });

    if (!professionalId) {
      return validationError('professionalId is required');
    }

    const availability = await professionalService.getAvailability(professionalId);

    if (!availability) {
      return notFoundError('Availability not found');
    }

    return successResponse(availability);
  } catch (error) {
    logger.error('Error getting availability', { error });

    return internalError();
  }
};
