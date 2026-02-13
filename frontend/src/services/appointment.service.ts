import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Appointment, AvailableSlot } from '../types';

export interface CreateAppointmentData {
  patientId: string;
  professionalId: string;
  productId: string;
  startTime: string;
  tenantId: string;
  notes?: string;
}

export interface RescheduleAppointmentData {
  newDateTime: string;
  rescheduledBy: string;
}

export interface CancelAppointmentData {
  cancelledBy: string;
}

class AppointmentService {
  async create(data: CreateAppointmentData): Promise<Appointment> {
    const response = await api.post<Appointment>(API_ENDPOINTS.APPOINTMENTS, data);
    return response.data;
  }

  async get(id: string, tenantId: string): Promise<Appointment> {
    const response = await api.get<Appointment>(
      `${API_ENDPOINTS.APPOINTMENT(id)}?tenantId=${tenantId}`
    );
    return response.data;
  }

  async list(params: {
    tenantId?: string;
    patientId?: string;
    professionalId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await api.get<Appointment[]>(
      `${API_ENDPOINTS.APPOINTMENTS}?${queryParams.toString()}`
    );
    return response.data;
  }

  async reschedule(
    id: string,
    tenantId: string,
    data: RescheduleAppointmentData
  ): Promise<Appointment> {
    const response = await api.put<Appointment>(
      `${API_ENDPOINTS.APPOINTMENT_RESCHEDULE(id)}?tenantId=${tenantId}`,
      data
    );
    return response.data;
  }

  async cancel(id: string, tenantId: string, cancelledBy?: string): Promise<Appointment> {
    const response = await api.put<Appointment>(
      `${API_ENDPOINTS.APPOINTMENT_CANCEL(id)}?tenantId=${tenantId}`,
      { cancelledBy: cancelledBy || 'patient' }
    );
    return response.data;
  }

  async getAvailableSlots(params: {
    professionalId: string;
    tenantId: string;
    productId: string;
    startDate: string;
    endDate: string;
  }): Promise<AvailableSlot[]> {
    const queryParams = new URLSearchParams(params as any);
    const response = await api.get<AvailableSlot[]>(
      `${API_ENDPOINTS.AVAILABILITY}?${queryParams.toString()}`
    );
    return response.data;
  }
}

export const appointmentService = new AppointmentService();
