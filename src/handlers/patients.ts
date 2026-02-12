import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { patientService } from '../services/patient';
import {
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';
import { EntityNotFoundError } from '../repositories/types';

const logger = createLogger('PatientsHandler');

/**
 * Create patient
 * POST /patients
 */
export const createPatient = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Create patient request', { requestId: event.requestContext.requestId });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const body = JSON.parse(event.body);
    const patient = await patientService.createPatient(body);

    return successResponse(patient, 201);
  } catch (error) {
    logger.error('Failed to create patient', error);

    if (error instanceof ValidationError) {
      return validationError(error.message, error.details);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to create patient', 500);
  }
};

/**
 * Get patient by ID
 * GET /patients/{id}
 */
export const getPatient = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    if (!patientId || !tenantId) {
      return validationError('patientId and tenantId are required');
    }

    const patient = await patientService.getPatient(patientId, tenantId);

    return successResponse(patient);
  } catch (error) {
    logger.error('Failed to get patient', error);

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to get patient', 500);
  }
};

/**
 * List patients
 * GET /patients
 */
export const listPatients = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.queryStringParameters?.tenantId;

    if (!tenantId) {
      return validationError('tenantId is required');
    }

    const patients = await patientService.listPatients({ tenantId });

    return successResponse({ patients, count: patients.length });
  } catch (error) {
    logger.error('Failed to list patients', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to list patients', 500);
  }
};

/**
 * Update patient
 * PUT /patients/{id}
 */
export const updatePatient = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    if (!patientId || !tenantId) {
      return validationError('patientId and tenantId are required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const updates = JSON.parse(event.body);
    const patient = await patientService.updatePatient(patientId, tenantId, updates);

    return successResponse(patient);
  } catch (error) {
    logger.error('Failed to update patient', error);

    if (error instanceof ValidationError) {
      return validationError(error.message, error.details);
    }

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to update patient', 500);
  }
};

/**
 * Delete patient
 * DELETE /patients/{id}
 */
export const deletePatient = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    if (!patientId || !tenantId) {
      return validationError('patientId and tenantId are required');
    }

    await patientService.deletePatient(patientId, tenantId);

    return successResponse({ message: 'Patient deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete patient', error);

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to delete patient', 500);
  }
};
