import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { appointmentService } from '../services/appointment/appointment.service';
import { successResponse, validationError, notFoundError, internalError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';
import { EntityNotFoundError } from '../repositories/types';

const logger = createLogger('AppointmentHandlers');

/**
 * Create a new appointment
 * POST /appointments
 */
export const createAppointment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Create appointment request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const input = JSON.parse(event.body);
    const appointment = await appointmentService.createAppointment(input);

    return successResponse(appointment, 201);
  } catch (error) {
    logger.error('Error creating appointment', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    if (error instanceof Error) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Get appointment by ID
 * GET /appointments/{id}
 */
export const getAppointment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const appointmentId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Get appointment request', { appointmentId, tenantId });

    if (!appointmentId || !tenantId) {
      return validationError('appointmentId and tenantId are required');
    }

    const appointment = await appointmentService.getAppointment(appointmentId, tenantId);

    return successResponse(appointment);
  } catch (error) {
    logger.error('Error getting appointment', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};

/**
 * List appointments
 * GET /appointments
 */
export const listAppointments = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const tenantId = event.queryStringParameters?.tenantId;
    const patientId = event.queryStringParameters?.patientId;
    const professionalId = event.queryStringParameters?.professionalId;
    const status = event.queryStringParameters?.status as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | undefined;
    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;
    const limit = event.queryStringParameters?.limit;

    logger.info('List appointments request', {
      tenantId,
      patientId,
      professionalId,
      status,
    });

    const filters = {
      tenantId,
      patientId,
      professionalId,
      status,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const appointments = await appointmentService.listAppointments(filters);

    return successResponse({ appointments, count: appointments.length });
  } catch (error) {
    logger.error('Error listing appointments', { error });

    if (error instanceof Error) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Reschedule appointment
 * PUT /appointments/{id}/reschedule
 */
export const rescheduleAppointment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const appointmentId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Reschedule appointment request', { appointmentId, tenantId });

    if (!appointmentId || !tenantId) {
      return validationError('appointmentId and tenantId are required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const { newDateTime, rescheduledBy } = JSON.parse(event.body);

    if (!newDateTime || !rescheduledBy) {
      return validationError('newDateTime and rescheduledBy are required');
    }

    const appointment = await appointmentService.rescheduleAppointment(
      appointmentId,
      tenantId,
      newDateTime,
      rescheduledBy
    );

    return successResponse(appointment);
  } catch (error) {
    logger.error('Error rescheduling appointment', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    if (error instanceof Error) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Cancel appointment
 * PUT /appointments/{id}/cancel
 */
export const cancelAppointment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const appointmentId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Cancel appointment request', { appointmentId, tenantId });

    if (!appointmentId || !tenantId) {
      return validationError('appointmentId and tenantId are required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const { cancelledBy } = JSON.parse(event.body);

    if (!cancelledBy) {
      return validationError('cancelledBy is required');
    }

    const appointment = await appointmentService.cancelAppointment(
      appointmentId,
      tenantId,
      cancelledBy
    );

    return successResponse(appointment);
  } catch (error) {
    logger.error('Error cancelling appointment', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    if (error instanceof Error) {
      return validationError(error.message);
    }

    return internalError();
  }
};
