import {
  Patient,
  Professional,
  Product,
  Appointment,
  Subscription,
  Availability,
  DynamoDBKeys,
} from '../shared/types';

// Extended types with DynamoDB keys
export interface PatientEntity extends Patient, DynamoDBKeys {}
export interface ProfessionalEntity extends Professional, DynamoDBKeys {}
export interface ProductEntity extends Product, DynamoDBKeys {}
export interface AppointmentEntity extends Appointment, DynamoDBKeys {}
export interface SubscriptionEntity extends Subscription, DynamoDBKeys {}
export interface AvailabilityEntity extends Availability, DynamoDBKeys {}

// Input types for creation
export interface CreatePatientInput {
  patientId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
}

export interface CreateProfessionalInput {
  professionalId: string;
  tenantId: string;
  name: string;
  email: string;
  specialty: string;
  googleCalendarToken?: string;
}

export interface CreateProductInput {
  productId: string;
  tenantId: string;
  professionalId: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface CreateAppointmentInput {
  appointmentId: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  productId: string;
  dateTime: string;
  googleCalendarEventId?: string;
}

export interface CreateSubscriptionInput {
  subscriptionId: string;
  tenantId: string;
  professionalId: string;
  plan: string;
  startDate: string;
  endDate?: string;
}

// Update types
export interface UpdatePatientInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateProfessionalInput {
  name?: string;
  email?: string;
  specialty?: string;
  googleCalendarToken?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  durationMinutes?: number;
  active?: boolean;
}

export interface UpdateAppointmentInput {
  dateTime?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  googleCalendarEventId?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

// Query filters
export interface QueryOptions {
  limit?: number;
  nextToken?: string;
  sortAscending?: boolean;
}

export interface PatientFilters extends QueryOptions {
  tenantId: string;
}

export interface ProductFilters extends QueryOptions {
  tenantId: string;
  professionalId?: string;
  active?: boolean;
}

export interface AppointmentFilters extends QueryOptions {
  tenantId?: string;
  patientId?: string;
  professionalId?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}

export interface SubscriptionFilters extends QueryOptions {
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
}

// Repository errors
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class EntityNotFoundError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

export class DuplicateEntityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEntityError';
  }
}
