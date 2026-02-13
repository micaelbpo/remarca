export type UserType = 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  userType: UserType;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  tenantId: string;
  availability?: WeeklySchedule;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  professionalId: string;
  tenantId: string;
  active: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  productId: string;
  dateTime: string;
  startTime?: string;
  status: AppointmentStatus;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  rescheduledFrom?: string;
  rescheduledBy?: string;
  productName?: string;
  patientName?: string;
  professionalName?: string;
  durationMinutes?: number;
  notes?: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
}
