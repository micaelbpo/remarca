import { createLogger } from '../../shared/utils/logger';
import { Appointment } from '../../shared/types';

const logger = createLogger('GoogleCalendarService');

/**
 * Google Calendar Integration Service (Stub for MVP)
 * TODO: Implement full Google Calendar API integration
 */
export class GoogleCalendarService {
  async authorizeCalendar(professionalId: string, _authCode: string): Promise<void> {
    logger.info('Google Calendar authorization (stub)', { professionalId });
    // TODO: Implement OAuth2 flow
  }

  async createEvent(professionalId: string, appointment: Appointment): Promise<string> {
    logger.info('Creating Google Calendar event (stub)', { professionalId, appointmentId: appointment.appointmentId });
    // TODO: Implement event creation
    return `gcal-event-${appointment.appointmentId}`;
  }

  async updateEvent(professionalId: string, eventId: string, _appointment: Appointment): Promise<void> {
    logger.info('Updating Google Calendar event (stub)', { professionalId, eventId });
    // TODO: Implement event update
  }

  async deleteEvent(professionalId: string, eventId: string): Promise<void> {
    logger.info('Deleting Google Calendar event (stub)', { professionalId, eventId });
    // TODO: Implement event deletion
  }

  async getEvents(professionalId: string, startDate: string, endDate: string): Promise<Array<{ id: string; start: string; end: string }>> {
    logger.info('Getting Google Calendar events (stub)', { professionalId, startDate, endDate });
    // TODO: Implement event fetching
    return [];
  }
}

export const googleCalendarService = new GoogleCalendarService();
