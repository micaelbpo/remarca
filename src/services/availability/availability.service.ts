import { dynamoDBRepository } from '../../repositories/dynamodb.repository';
import { professionalService } from '../professional/professional.service';
import { productService } from '../product/product.service';
import { googleCalendarService } from '../google-calendar/google-calendar.service';
import { createLogger } from '../../shared/utils/logger';
import { validateRequired } from '../../shared/utils/validation';
import { Availability, WeeklySchedule, TimeSlot } from '../../shared/types';
import { AppointmentEntity } from '../../repositories/types';

const logger = createLogger('AvailabilityService');

interface AvailableSlot {
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  available: boolean;
}

interface GetAvailableSlotsInput {
  professionalId: string;
  tenantId: string;
  productId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Availability Service - Calculate available time slots
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 17.1, 17.2, 17.5
 */
export class AvailabilityService {
  /**
   * Get available slots for a professional and product within a date range
   * Validates: Requirements 5.2, 5.3, 5.4, 17.1, 17.2, 17.3, 17.4, 17.5
   */
  async getAvailableSlots(input: GetAvailableSlotsInput): Promise<AvailableSlot[]> {
    logger.info('Getting available slots', {
      professionalId: input.professionalId,
      productId: input.productId,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    // Validate inputs
    validateRequired(input.professionalId, 'professionalId');
    validateRequired(input.tenantId, 'tenantId');
    validateRequired(input.productId, 'productId');
    validateRequired(input.startDate, 'startDate');
    validateRequired(input.endDate, 'endDate');

    // Get professional availability configuration
    const availability = await professionalService.getAvailability(input.professionalId);
    if (!availability) {
      logger.warn('No availability configured for professional', {
        professionalId: input.professionalId,
      });
      return [];
    }

    // Get product to know duration
    const product = await productService.getProduct(input.productId, input.tenantId);

    // Generate all possible slots based on availability
    const possibleSlots = this.generatePossibleSlots(
      availability,
      input.startDate,
      input.endDate,
      product.durationMinutes
    );

    // Get occupied slots from appointments
    const occupiedSlots = await this.getOccupiedSlots(
      input.professionalId,
      input.tenantId,
      input.startDate,
      input.endDate
    );

    // Get Google Calendar conflicts (stub for now)
    const calendarConflicts = await this.getCalendarConflicts(
      input.professionalId,
      input.startDate,
      input.endDate
    );

    // Filter out occupied and conflicting slots
    const availableSlots = possibleSlots.filter((slot) => {
      const isOccupied = this.isSlotOccupied(slot, occupiedSlots);
      const hasConflict = this.isSlotOccupied(slot, calendarConflicts);
      return !isOccupied && !hasConflict;
    });

    // Sort chronologically
    availableSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    logger.info('Available slots calculated', {
      total: possibleSlots.length,
      available: availableSlots.length,
      occupied: occupiedSlots.length,
    });

    return availableSlots;
  }

  /**
   * Check if a specific slot is available
   * Validates: Requirements 5.5
   */
  async isSlotAvailable(
    professionalId: string,
    tenantId: string,
    productId: string,
    startDateTime: string
  ): Promise<boolean> {
    logger.debug('Checking slot availability', { professionalId, startDateTime });

    validateRequired(professionalId, 'professionalId');
    validateRequired(tenantId, 'tenantId');
    validateRequired(productId, 'productId');
    validateRequired(startDateTime, 'startDateTime');

    // Get product duration
    const product = await productService.getProduct(productId, tenantId);
    const endDateTime = this.addMinutes(startDateTime, product.durationMinutes);

    // Extract date for range query
    const date = startDateTime.split('T')[0];

    // Get available slots for that day
    const slots = await this.getAvailableSlots({
      professionalId,
      tenantId,
      productId,
      startDate: date,
      endDate: date,
    });

    // Check if requested slot exists in available slots
    const isAvailable = slots.some(
      (slot) => slot.start === startDateTime && slot.end === endDateTime
    );

    logger.debug('Slot availability checked', { startDateTime, isAvailable });

    return isAvailable;
  }

  /**
   * Generate all possible slots based on professional availability
   * Validates: Requirements 5.2, 5.4
   */
  private generatePossibleSlots(
    availability: Availability,
    startDate: string,
    endDate: string,
    durationMinutes: number
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = this.getDayOfWeek(date) as keyof WeeklySchedule;
      const daySchedule = availability.schedule[dayOfWeek];

      if (!daySchedule) {
        continue; // No availability for this day
      }

      // Handle both array format and DaySchedule format
      let timeSlots: TimeSlot[] = [];
      if (Array.isArray(daySchedule)) {
        timeSlots = daySchedule;
      } else if (daySchedule.enabled && daySchedule.slots) {
        timeSlots = daySchedule.slots;
      }

      if (timeSlots.length === 0) {
        continue;
      }

      // Generate slots for each time range in the day
      timeSlots.forEach((timeSlot: TimeSlot) => {
        // Support both formats: {start, end} and {startTime, endTime}
        const startTime = timeSlot.start || timeSlot.startTime;
        const endTime = timeSlot.end || timeSlot.endTime;

        if (startTime && endTime) {
          const daySlots = this.generateSlotsForTimeRange(
            date,
            startTime,
            endTime,
            durationMinutes
          );
          slots.push(...daySlots);
        }
      });
    }

    return slots;
  }

  /**
   * Generate slots for a specific time range
   */
  private generateSlotsForTimeRange(
    date: Date,
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const rangeEnd = new Date(date);
    rangeEnd.setHours(endHour, endMinute, 0, 0);

    while (slotStart < rangeEnd) {
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Only add slot if it fits completely within the time range
      if (slotEnd <= rangeEnd) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: true,
        });
      }

      // Move to next slot
      slotStart.setMinutes(slotStart.getMinutes() + durationMinutes);
    }

    return slots;
  }

  /**
   * Get occupied slots from existing appointments
   * Validates: Requirements 5.3
   */
  private async getOccupiedSlots(
    professionalId: string,
    _tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailableSlot[]> {
    // Query appointments for this professional in the date range
    const appointments = await dynamoDBRepository.query<AppointmentEntity>(
      'GSI1PK = :gsi1pk AND GSI1SK BETWEEN :start AND :end',
      {
        ':gsi1pk': `PROFESSIONAL#${professionalId}`,
        ':start': `APPOINTMENT#${startDate}`,
        ':end': `APPOINTMENT#${endDate}Z`,
      },
      {
        indexName: 'GSI1',
      }
    );

    // Filter only scheduled appointments (not cancelled)
    const scheduledAppointments = appointments.filter((apt) => apt.status === 'SCHEDULED');

    // Convert to slot format - need to get product duration
    const slots: AvailableSlot[] = [];
    for (const apt of scheduledAppointments) {
      // For now, we'll use a default duration if not stored in appointment
      // In a real implementation, we'd fetch the product or store duration in appointment
      const durationMinutes = 60; // Default duration
      slots.push({
        start: apt.dateTime,
        end: this.addMinutes(apt.dateTime, durationMinutes),
        available: false,
      });
    }

    return slots;
  }

  /**
   * Get conflicts from Google Calendar
   * Validates: Requirements 4.5, 5.5
   */
  private async getCalendarConflicts(
    professionalId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailableSlot[]> {
    try {
      const events = await googleCalendarService.getEvents(professionalId, startDate, endDate);

      return events.map((event) => ({
        start: event.start,
        end: event.end,
        available: false,
      }));
    } catch (error) {
      logger.warn('Failed to get Google Calendar events', { professionalId, error });
      return []; // Don't block if calendar is unavailable
    }
  }

  /**
   * Check if a slot overlaps with any occupied slots
   */
  private isSlotOccupied(slot: AvailableSlot, occupiedSlots: AvailableSlot[]): boolean {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    return occupiedSlots.some((occupied) => {
      const occupiedStart = new Date(occupied.start).getTime();
      const occupiedEnd = new Date(occupied.end).getTime();

      // Check for any overlap
      return slotStart < occupiedEnd && slotEnd > occupiedStart;
    });
  }

  /**
   * Helper: Get day of week name
   */
  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Helper: Add minutes to ISO datetime string
   */
  private addMinutes(isoDateTime: string, minutes: number): string {
    const date = new Date(isoDateTime);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();
