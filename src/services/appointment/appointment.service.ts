import { v4 as uuidv4 } from 'uuid';
import { dynamoDBRepository } from '../../repositories/dynamodb.repository';
import { availabilityService } from '../availability/availability.service';
import { patientService } from '../patient/patient.service';
import { professionalService } from '../professional/professional.service';
import { productService } from '../product/product.service';
import { googleCalendarService } from '../google-calendar/google-calendar.service';
import { notificationService } from '../notification/notification.service';
import { createLogger } from '../../shared/utils/logger';
import { validateRequired } from '../../shared/utils/validation';
import { appointmentKeys } from '../../shared/utils/dynamodb-keys';
import { Appointment } from '../../shared/types';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentEntity,
  AppointmentFilters,
  EntityNotFoundError,
} from '../../repositories/types';

const logger = createLogger('AppointmentService');

export class AppointmentService {
  /**
   * Create a new appointment
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 19.4
   */
  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    logger.info('Creating appointment', {
      patientId: input.patientId,
      professionalId: input.professionalId,
      dateTime: input.dateTime,
    });

    // Validate required fields
    validateRequired(input.tenantId, 'tenantId');
    validateRequired(input.patientId, 'patientId');
    validateRequired(input.professionalId, 'professionalId');
    validateRequired(input.productId, 'productId');
    validateRequired(input.dateTime, 'dateTime');

    // Validate date is in the future
    const appointmentDate = new Date(input.dateTime);
    const now = new Date();
    if (appointmentDate <= now) {
      throw new Error('Appointment date must be in the future');
    }

    // Verify patient exists
    await patientService.getPatient(input.patientId, input.tenantId);

    // Verify professional exists
    await professionalService.getProfessional(input.professionalId, input.tenantId);

    // Verify product exists and is active
    const product = await productService.getProduct(input.productId, input.tenantId);
    if (!product.active) {
      throw new Error('Product is not active');
    }

    // Check if slot is available
    const isAvailable = await availabilityService.isSlotAvailable(
      input.professionalId,
      input.tenantId,
      input.productId,
      input.dateTime
    );

    if (!isAvailable) {
      throw new Error('Selected time slot is not available');
    }

    const appointmentId = input.appointmentId || uuidv4();
    const now_iso = new Date().toISOString();

    // Create appointment entity
    const appointmentData: Appointment = {
      appointmentId,
      tenantId: input.tenantId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      productId: input.productId,
      dateTime: input.dateTime,
      status: 'SCHEDULED',
      createdAt: now_iso,
      updatedAt: now_iso,
    };

    // Add DynamoDB keys
    const appointmentEntity: AppointmentEntity = {
      ...appointmentData,
      ...appointmentKeys(appointmentId, input.tenantId, input.professionalId, input.dateTime),
    };

    // Use transaction to ensure atomicity
    await dynamoDBRepository.put(appointmentEntity);

    // Create Google Calendar event (async, don't block)
    try {
      const eventId = await googleCalendarService.createEvent(
        input.professionalId,
        appointmentData
      );
      
      // Update appointment with calendar event ID
      if (eventId) {
        appointmentEntity.googleCalendarEventId = eventId;
        await dynamoDBRepository.update<AppointmentEntity>(
          appointmentEntity.PK,
          appointmentEntity.SK,
          { googleCalendarEventId: eventId }
        );
        appointmentData.googleCalendarEventId = eventId;
      }
    } catch (error) {
      logger.warn('Failed to create Google Calendar event', { appointmentId, error });
      // Continue - calendar sync is not critical for MVP
    }

    // Send notifications (async, don't block)
    try {
      await notificationService.notifyAppointmentCreated(appointmentData);
    } catch (error) {
      logger.warn('Failed to send appointment notifications', { appointmentId, error });
      // Continue - notifications are not critical
    }

    logger.info('Appointment created successfully', { appointmentId });

    return appointmentData;
  }

  /**
   * Get appointment by ID
   * Validates: Requirements 6.1, 12.2
   */
  async getAppointment(appointmentId: string, tenantId: string): Promise<Appointment> {
    logger.debug('Getting appointment', { appointmentId, tenantId });

    validateRequired(appointmentId, 'appointmentId');
    validateRequired(tenantId, 'tenantId');

    // Query by tenant and appointment ID
    const appointments = await dynamoDBRepository.query<AppointmentEntity>(
      'PK = :pk AND begins_with(SK, :sk)',
      {
        ':pk': `TENANT#${tenantId}`,
        ':sk': `APPOINTMENT#${appointmentId}`,
      }
    );

    if (appointments.length === 0) {
      throw new EntityNotFoundError('Appointment', appointmentId);
    }

    const appointmentEntity = appointments[0];

    const appointment: Appointment = {
      appointmentId: appointmentEntity.appointmentId,
      tenantId: appointmentEntity.tenantId,
      patientId: appointmentEntity.patientId,
      professionalId: appointmentEntity.professionalId,
      productId: appointmentEntity.productId,
      dateTime: appointmentEntity.dateTime,
      status: appointmentEntity.status,
      googleCalendarEventId: appointmentEntity.googleCalendarEventId,
      createdAt: appointmentEntity.createdAt,
      updatedAt: appointmentEntity.updatedAt,
      cancelledAt: appointmentEntity.cancelledAt,
      cancelledBy: appointmentEntity.cancelledBy,
    };

    logger.debug('Appointment retrieved successfully', { appointmentId });

    return appointment;
  }

  /**
   * List appointments with filters
   * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5
   */
  async listAppointments(filters: AppointmentFilters): Promise<Appointment[]> {
    logger.debug('Listing appointments', {
      tenantId: filters.tenantId,
      patientId: filters.patientId,
      professionalId: filters.professionalId,
      status: filters.status,
    });

    let appointmentEntities: AppointmentEntity[];

    if (filters.professionalId) {
      // Query by professional using GSI1
      appointmentEntities = await dynamoDBRepository.query<AppointmentEntity>(
        'GSI1PK = :gsi1pk',
        {
          ':gsi1pk': `PROFESSIONAL#${filters.professionalId}`,
        },
        {
          indexName: 'GSI1',
          limit: filters.limit,
          scanIndexForward: filters.sortAscending,
        }
      );
    } else if (filters.patientId) {
      // Query by patient using GSI2
      appointmentEntities = await dynamoDBRepository.query<AppointmentEntity>(
        'GSI2PK = :gsi2pk',
        {
          ':gsi2pk': `PATIENT#${filters.patientId}`,
        },
        {
          indexName: 'GSI2',
          limit: filters.limit,
          scanIndexForward: filters.sortAscending,
        }
      );
    } else if (filters.tenantId) {
      // Query by tenant
      appointmentEntities = await dynamoDBRepository.query<AppointmentEntity>(
        'PK = :pk AND begins_with(SK, :sk)',
        {
          ':pk': `TENANT#${filters.tenantId}`,
          ':sk': 'APPOINTMENT#',
        },
        {
          limit: filters.limit,
          scanIndexForward: filters.sortAscending,
        }
      );
    } else {
      throw new Error('At least one filter (tenantId, patientId, or professionalId) is required');
    }

    // Apply status filter if specified
    let filteredAppointments = appointmentEntities;
    if (filters.status) {
      filteredAppointments = appointmentEntities.filter((apt) => apt.status === filters.status);
    }

    // Apply date range filter if specified
    if (filters.startDate || filters.endDate) {
      filteredAppointments = filteredAppointments.filter((apt) => {
        const aptDate = new Date(apt.dateTime);
        if (filters.startDate && aptDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && aptDate > new Date(filters.endDate)) {
          return false;
        }
        return true;
      });
    }

    const appointments = filteredAppointments.map((entity) => ({
      appointmentId: entity.appointmentId,
      tenantId: entity.tenantId,
      patientId: entity.patientId,
      professionalId: entity.professionalId,
      productId: entity.productId,
      dateTime: entity.dateTime,
      status: entity.status,
      googleCalendarEventId: entity.googleCalendarEventId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      cancelledAt: entity.cancelledAt,
      cancelledBy: entity.cancelledBy,
    }));

    logger.debug('Appointments listed successfully', { count: appointments.length });

    return appointments;
  }

  /**
   * Reschedule appointment
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async rescheduleAppointment(
    appointmentId: string,
    tenantId: string,
    newDateTime: string,
    _rescheduledBy: string
  ): Promise<Appointment> {
    logger.info('Rescheduling appointment', { appointmentId, newDateTime });

    validateRequired(appointmentId, 'appointmentId');
    validateRequired(tenantId, 'tenantId');
    validateRequired(newDateTime, 'newDateTime');

    // Get existing appointment
    const appointment = await this.getAppointment(appointmentId, tenantId);

    // Validate appointment can be rescheduled
    if (appointment.status === 'CANCELLED') {
      throw new Error('Cannot reschedule a cancelled appointment');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot reschedule a completed appointment');
    }

    // Validate new date is in the future
    const newDate = new Date(newDateTime);
    const now = new Date();
    if (newDate <= now) {
      throw new Error('New appointment date must be in the future');
    }

    // Check if new slot is available
    const isAvailable = await availabilityService.isSlotAvailable(
      appointment.professionalId,
      tenantId,
      appointment.productId,
      newDateTime
    );

    if (!isAvailable) {
      throw new Error('Selected time slot is not available');
    }

    const oldDateTime = appointment.dateTime;

    // Update appointment
    const updates: UpdateAppointmentInput = {
      dateTime: newDateTime,
    };

    const keys = appointmentKeys(
      appointmentId,
      tenantId,
      appointment.professionalId,
      appointment.dateTime
    );

    const updatedEntity = await dynamoDBRepository.update<AppointmentEntity>(
      keys.PK,
      keys.SK,
      updates
    );

    const updatedAppointment: Appointment = {
      appointmentId: updatedEntity.appointmentId,
      tenantId: updatedEntity.tenantId,
      patientId: updatedEntity.patientId,
      professionalId: updatedEntity.professionalId,
      productId: updatedEntity.productId,
      dateTime: updatedEntity.dateTime,
      status: updatedEntity.status,
      googleCalendarEventId: updatedEntity.googleCalendarEventId,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
      cancelledAt: updatedEntity.cancelledAt,
      cancelledBy: updatedEntity.cancelledBy,
    };

    // Update Google Calendar event (async)
    try {
      if (appointment.googleCalendarEventId) {
        await googleCalendarService.updateEvent(
          appointment.professionalId,
          appointment.googleCalendarEventId,
          updatedAppointment
        );
      }
    } catch (error) {
      logger.warn('Failed to update Google Calendar event', { appointmentId, error });
    }

    // Send notifications (async)
    try {
      await notificationService.notifyAppointmentRescheduled(updatedAppointment, oldDateTime);
    } catch (error) {
      logger.warn('Failed to send reschedule notifications', { appointmentId, error });
    }

    logger.info('Appointment rescheduled successfully', { appointmentId });

    return updatedAppointment;
  }

  /**
   * Cancel appointment
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async cancelAppointment(
    appointmentId: string,
    tenantId: string,
    cancelledBy: string
  ): Promise<Appointment> {
    logger.info('Cancelling appointment', { appointmentId, cancelledBy });

    validateRequired(appointmentId, 'appointmentId');
    validateRequired(tenantId, 'tenantId');
    validateRequired(cancelledBy, 'cancelledBy');

    // Get existing appointment
    const appointment = await this.getAppointment(appointmentId, tenantId);

    // Validate appointment can be cancelled
    if (appointment.status === 'CANCELLED') {
      throw new Error('Appointment is already cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed appointment');
    }

    // Update appointment status
    const updates: UpdateAppointmentInput = {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelledBy,
    };

    const keys = appointmentKeys(
      appointmentId,
      tenantId,
      appointment.professionalId,
      appointment.dateTime
    );

    const updatedEntity = await dynamoDBRepository.update<AppointmentEntity>(
      keys.PK,
      keys.SK,
      updates
    );

    const cancelledAppointment: Appointment = {
      appointmentId: updatedEntity.appointmentId,
      tenantId: updatedEntity.tenantId,
      patientId: updatedEntity.patientId,
      professionalId: updatedEntity.professionalId,
      productId: updatedEntity.productId,
      dateTime: updatedEntity.dateTime,
      status: updatedEntity.status,
      googleCalendarEventId: updatedEntity.googleCalendarEventId,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
      cancelledAt: updatedEntity.cancelledAt,
      cancelledBy: updatedEntity.cancelledBy,
    };

    // Delete Google Calendar event (async)
    try {
      if (appointment.googleCalendarEventId) {
        await googleCalendarService.deleteEvent(
          appointment.professionalId,
          appointment.googleCalendarEventId
        );
      }
    } catch (error) {
      logger.warn('Failed to delete Google Calendar event', { appointmentId, error });
    }

    // Send notifications (async)
    try {
      await notificationService.notifyAppointmentCancelled(cancelledAppointment);
    } catch (error) {
      logger.warn('Failed to send cancellation notifications', { appointmentId, error });
    }

    logger.info('Appointment cancelled successfully', { appointmentId });

    return cancelledAppointment;
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
