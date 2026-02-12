import { createLogger } from '../../shared/utils/logger';
import { Appointment } from '../../shared/types';

const logger = createLogger('NotificationService');

/**
 * Notification Service (Stub for MVP)
 * TODO: Implement SES email sending
 */
export class NotificationService {
  async sendEmail(to: string, template: string, data: Record<string, unknown>): Promise<void> {
    logger.info('Sending email (stub)', { to, template });
    // TODO: Implement SES email sending
  }

  async notifyAppointmentCreated(appointment: Appointment): Promise<void> {
    logger.info('Notifying appointment created (stub)', { appointmentId: appointment.appointmentId });
    // TODO: Send emails to patient and professional
  }

  async notifyAppointmentRescheduled(appointment: Appointment, oldDateTime: string): Promise<void> {
    logger.info('Notifying appointment rescheduled (stub)', { appointmentId: appointment.appointmentId });
    // TODO: Send emails to patient and professional
  }

  async notifyAppointmentCancelled(appointment: Appointment): Promise<void> {
    logger.info('Notifying appointment cancelled (stub)', { appointmentId: appointment.appointmentId });
    // TODO: Send emails to patient and professional
  }
}

export const notificationService = new NotificationService();
