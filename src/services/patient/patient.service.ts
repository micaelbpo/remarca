import { v4 as uuidv4 } from 'uuid';
import { dynamoDBRepository } from '../../repositories/dynamodb.repository';
import { createLogger } from '../../shared/utils/logger';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  ValidationError,
} from '../../shared/utils/validation';
import { patientKeys } from '../../shared/utils/dynamodb-keys';
import { encryptSensitiveFields, decryptSensitiveFields } from '../../shared/utils/encryption';
import { Patient } from '../../shared/types';
import {
  CreatePatientInput,
  UpdatePatientInput,
  PatientFilters,
  PatientEntity,
  EntityNotFoundError,
  DuplicateEntityError,
} from '../../repositories/types';

const logger = createLogger('PatientService');

export class PatientService {
  /**
   * Create a new patient
   * Validates: Requirements 2.1, 2.2, 2.4, 2.5
   */
  async createPatient(input: CreatePatientInput): Promise<Patient> {
    logger.info('Creating patient', { email: input.email, tenantId: input.tenantId });

    // Validate required fields
    validateRequired(input.name, 'name');
    validateRequired(input.email, 'email');
    validateRequired(input.phone, 'phone');
    validateRequired(input.tenantId, 'tenantId');

    // Validate email format
    if (!validateEmail(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate phone format
    if (!validatePhone(input.phone)) {
      throw new ValidationError('Invalid phone format');
    }

    // Check if email already exists
    const existingPatients = await this.findByEmail(input.email, input.tenantId);
    if (existingPatients.length > 0) {
      throw new DuplicateEntityError('Email already registered');
    }

    const patientId = input.patientId || uuidv4();
    const now = new Date().toISOString();

    // Create patient entity with encrypted sensitive data
    const patientData: Patient = {
      patientId,
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      createdAt: now,
      updatedAt: now,
    };

    // Encrypt sensitive fields
    const encryptedData = encryptSensitiveFields(patientData, ['email', 'phone']);

    // Add DynamoDB keys
    const patientEntity: PatientEntity = {
      ...encryptedData,
      ...patientKeys(patientId, input.tenantId),
    };

    await dynamoDBRepository.put(patientEntity);

    logger.info('Patient created successfully', { patientId, tenantId: input.tenantId });

    return patientData;
  }

  /**
   * Get patient by ID
   * Validates: Requirements 2.1, 2.5, 12.2
   */
  async getPatient(patientId: string, tenantId: string): Promise<Patient> {
    logger.debug('Getting patient', { patientId, tenantId });

    validateRequired(patientId, 'patientId');
    validateRequired(tenantId, 'tenantId');

    const keys = patientKeys(patientId, tenantId);
    const patientEntity = await dynamoDBRepository.get<PatientEntity>(keys.PK, keys.SK);

    if (!patientEntity) {
      throw new EntityNotFoundError('Patient', patientId);
    }

    // Decrypt sensitive fields
    const decryptedData = decryptSensitiveFields(patientEntity, ['email', 'phone']);

    const patient: Patient = {
      patientId: decryptedData.patientId,
      tenantId: decryptedData.tenantId,
      name: decryptedData.name,
      email: decryptedData.email,
      phone: decryptedData.phone,
      createdAt: decryptedData.createdAt,
      updatedAt: decryptedData.updatedAt,
    };

    logger.debug('Patient retrieved successfully', { patientId });

    return patient;
  }

  /**
   * Update patient
   * Validates: Requirements 2.1, 2.4
   */
  async updatePatient(
    patientId: string,
    tenantId: string,
    updates: UpdatePatientInput
  ): Promise<Patient> {
    logger.info('Updating patient', { patientId, tenantId });

    validateRequired(patientId, 'patientId');
    validateRequired(tenantId, 'tenantId');

    // Validate email format if provided
    if (updates.email && !validateEmail(updates.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate phone format if provided
    if (updates.phone && !validatePhone(updates.phone)) {
      throw new ValidationError('Invalid phone format');
    }

    // Check if patient exists
    await this.getPatient(patientId, tenantId);

    // Encrypt sensitive fields if provided
    const encryptedUpdates = updates.email || updates.phone
      ? encryptSensitiveFields(updates, ['email', 'phone'])
      : updates;

    const keys = patientKeys(patientId, tenantId);
    const updatedEntity = await dynamoDBRepository.update<PatientEntity>(
      keys.PK,
      keys.SK,
      encryptedUpdates
    );

    // Decrypt for response
    const decryptedData = decryptSensitiveFields(updatedEntity, ['email', 'phone']);

    const patient: Patient = {
      patientId: decryptedData.patientId,
      tenantId: decryptedData.tenantId,
      name: decryptedData.name,
      email: decryptedData.email,
      phone: decryptedData.phone,
      createdAt: decryptedData.createdAt,
      updatedAt: decryptedData.updatedAt,
    };

    logger.info('Patient updated successfully', { patientId });

    return patient;
  }

  /**
   * List patients by tenant
   * Validates: Requirements 2.5, 12.2
   */
  async listPatients(filters: PatientFilters): Promise<Patient[]> {
    logger.debug('Listing patients', { tenantId: filters.tenantId });

    validateRequired(filters.tenantId, 'tenantId');

    const patientEntities = await dynamoDBRepository.query<PatientEntity>(
      'PK = :pk AND begins_with(SK, :sk)',
      {
        ':pk': `TENANT#${filters.tenantId}`,
        ':sk': 'PATIENT#',
      },
      {
        limit: filters.limit,
        scanIndexForward: filters.sortAscending,
      }
    );

    // Decrypt sensitive fields for all patients
    const patients = patientEntities.map((entity) => {
      const decrypted = decryptSensitiveFields(entity, ['email', 'phone']);
      return {
        patientId: decrypted.patientId,
        tenantId: decrypted.tenantId,
        name: decrypted.name,
        email: decrypted.email,
        phone: decrypted.phone,
        createdAt: decrypted.createdAt,
        updatedAt: decrypted.updatedAt,
      } as Patient;
    });

    logger.debug('Patients listed successfully', { count: patients.length });

    return patients;
  }

  /**
   * Delete patient (LGPD compliance)
   * Validates: Requirements 15.3
   */
  async deletePatient(patientId: string, tenantId: string): Promise<void> {
    logger.info('Deleting patient (LGPD)', { patientId, tenantId });

    validateRequired(patientId, 'patientId');
    validateRequired(tenantId, 'tenantId');

    // Check if patient exists
    await this.getPatient(patientId, tenantId);

    const keys = patientKeys(patientId, tenantId);
    await dynamoDBRepository.delete(keys.PK, keys.SK);

    logger.info('Patient deleted successfully', { patientId });
  }

  /**
   * Find patient by email (internal use)
   */
  private async findByEmail(email: string, tenantId: string): Promise<Patient[]> {
    const allPatients = await this.listPatients({ tenantId });
    return allPatients.filter((p) => p.email.toLowerCase() === email.toLowerCase());
  }
}

// Export singleton instance
export const patientService = new PatientService();
