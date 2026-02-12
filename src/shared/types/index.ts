// User Types
export type UserType = 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';

export interface User {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  tenantId: string;
  userType: UserType;
  email: string;
}

// Appointment Types
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  appointmentId: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  productId: string;
  dateTime: string;
  status: AppointmentStatus;
  googleCalendarEventId?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

// Professional Types
export interface Professional {
  professionalId: string;
  tenantId: string;
  name: string;
  email: string;
  specialty: string;
  googleCalendarToken?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient Types
export interface Patient {
  patientId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  productId: string;
  tenantId: string;
  professionalId: string;
  name: string;
  description: string;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Availability Types
export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface Availability {
  professionalId: string;
  schedule: WeeklySchedule;
  updatedAt: string;
}

// Subscription Types
export type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

export interface Subscription {
  subscriptionId: string;
  tenantId: string;
  professionalId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

// DynamoDB Key Types
export interface DynamoDBKeys {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
}

// API Response Types
export interface ApiResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}
