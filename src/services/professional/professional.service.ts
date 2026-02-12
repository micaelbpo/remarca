import { v4 as uuidv4 } from 'uuid';
import { dynamoDBRepository } from '../../repositories/dynamodb.repository';
import { createLogger } from '../../shared/utils/logger';
import { validateEmail, validateRequired, ValidationError } from '../../shared/utils/validation';
import { professionalKeys, availabilityKeys } from '../../shared/utils/dynamodb-keys';
import { encryptSensitiveFields, decryptSensitiveFields } from '../../shared/utils/encryption';
import { Professional, Availability } from '../../shared/types';
import {
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalEntity,
  AvailabilityEntity,
  EntityNotFoundError,
} from '../../repositories/types';

const logger = createLogger('ProfessionalService');

export class ProfessionalService {
  /**
   * Create a new professional
   * Validates: Requirements 3.1, 5.1
   */
  async createProfessional(input: CreateProfessionalInput): Promise<Professional> {
    logger.info('Creating professional', { email: input.email, tenantId: input.tenantId });

    // Validate required fields
    validateRequired(input.name, 'name');
    validateRequired(input.email, 'email');
    validateRequired(input.specialty, 'specialty');
    validateRequired(input.tenantId, 'tenantId');

    // Validate email format
    if (!validateEmail(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    const professionalId = input.professionalId || uuidv4();
    const now = new Date().toISOString();

    // Create professional entity
    const professionalData: Professional = {
      professionalId,
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      specialty: input.specialty,
      googleCalendarToken: input.googleCalendarToken,
      createdAt: now,
      updatedAt: now,
    };

    // Encrypt Google Calendar token if provided
    const encryptedData = input.googleCalendarToken
      ? encryptSensitiveFields(professionalData, ['googleCalendarToken'])
      : professionalData;

    // Add DynamoDB keys
    const professionalEntity: ProfessionalEntity = {
      ...encryptedData,
      ...professionalKeys(professionalId, input.tenantId),
    };

    await dynamoDBRepository.put(professionalEntity);

    logger.info('Professional created successfully', { professionalId, tenantId: input.tenantId });

    return professionalData;
  }

  /**
   * Get professional by ID
   * Validates: Requirements 3.1, 12.2
   */
  async getProfessional(professionalId: string, tenantId: string): Promise<Professional> {
    logger.debug('Getting professional', { professionalId, tenantId });

    validateRequired(professionalId, 'professionalId');
    validateRequired(tenantId, 'tenantId');

    const keys = professionalKeys(professionalId, tenantId);
    const professionalEntity = await dynamoDBRepository.get<ProfessionalEntity>(keys.PK, keys.SK);

    if (!professionalEntity) {
      throw new EntityNotFoundError('Professional', professionalId);
    }

    // Decrypt Google Calendar token if exists
    const decryptedData = professionalEntity.googleCalendarToken
      ? decryptSensitiveFields(professionalEntity, ['googleCalendarToken'])
      : professionalEntity;

    const professional: Professional = {
      professionalId: decryptedData.professionalId,
      tenantId: decryptedData.tenantId,
      name: decryptedData.name,
      email: decryptedData.email,
      specialty: decryptedData.specialty,
      googleCalendarToken: decryptedData.googleCalendarToken,
      createdAt: decryptedData.createdAt,
      updatedAt: decryptedData.updatedAt,
    };

    logger.debug('Professional retrieved successfully', { professionalId });

    return professional;
  }

  /**
   * Update professional
   * Validates: Requirements 3.1
   */
  async updateProfessional(
    professionalId: string,
    tenantId: string,
    updates: UpdateProfessionalInput
  ): Promise<Professional> {
    logger.info('Updating professional', { professionalId, tenantId });

    validateRequired(professionalId, 'professionalId');
    validateRequired(tenantId, 'tenantId');

    // Validate email format if provided
    if (updates.email && !validateEmail(updates.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if professional exists
    await this.getProfessional(professionalId, tenantId);

    // Encrypt Google Calendar token if provided
    const encryptedUpdates = updates.googleCalendarToken
      ? encryptSensitiveFields(updates, ['googleCalendarToken'])
      : updates;

    const keys = professionalKeys(professionalId, tenantId);
    const updatedEntity = await dynamoDBRepository.update<ProfessionalEntity>(
      keys.PK,
      keys.SK,
      encryptedUpdates
    );

    // Decrypt for response
    const decryptedData = updatedEntity.googleCalendarToken
      ? decryptSensitiveFields(updatedEntity, ['googleCalendarToken'])
      : updatedEntity;

    const professional: Professional = {
      professionalId: decryptedData.professionalId,
      tenantId: decryptedData.tenantId,
      name: decryptedData.name,
      email: decryptedData.email,
      specialty: decryptedData.specialty,
      googleCalendarToken: decryptedData.googleCalendarToken,
      createdAt: decryptedData.createdAt,
      updatedAt: decryptedData.updatedAt,
    };

    logger.info('Professional updated successfully', { professionalId });

    return professional;
  }

  /**
   * Set professional availability
   * Validates: Requirements 5.1
   */
  async setAvailability(professionalId: string, availability: Availability): Promise<void> {
    logger.info('Setting availability', { professionalId });

    validateRequired(professionalId, 'professionalId');
    validateRequired(availability.schedule, 'schedule');

    const now = new Date().toISOString();

    const availabilityEntity: AvailabilityEntity = {
      ...availability,
      professionalId,
      updatedAt: now,
      ...availabilityKeys(professionalId),
    };

    await dynamoDBRepository.put(availabilityEntity);

    logger.info('Availability set successfully', { professionalId });
  }

  /**
   * Get professional availability
   * Validates: Requirements 5.1
   */
  async getAvailability(professionalId: string): Promise<Availability | null> {
    logger.debug('Getting availability', { professionalId });

    validateRequired(professionalId, 'professionalId');

    const keys = availabilityKeys(professionalId);
    const availabilityEntity = await dynamoDBRepository.get<AvailabilityEntity>(keys.PK, keys.SK);

    if (!availabilityEntity) {
      logger.debug('No availability found', { professionalId });
      return null;
    }

    const availability: Availability = {
      professionalId: availabilityEntity.professionalId,
      schedule: availabilityEntity.schedule,
      updatedAt: availabilityEntity.updatedAt,
    };

    logger.debug('Availability retrieved successfully', { professionalId });

    return availability;
  }
}

// Export singleton instance
export const professionalService = new ProfessionalService();
