import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Professional, WeeklySchedule } from '../types';

export interface CreateProfessionalData {
  name: string;
  email: string;
  specialty: string;
  tenantId: string;
}

export interface UpdateProfessionalData {
  name?: string;
  specialty?: string;
}

class ProfessionalService {
  async create(data: CreateProfessionalData): Promise<Professional> {
    const response = await api.post<Professional>(API_ENDPOINTS.PROFESSIONALS, data);
    return response.data;
  }

  async get(id: string, tenantId: string): Promise<Professional> {
    const response = await api.get<Professional>(
      `${API_ENDPOINTS.PROFESSIONAL(id)}?tenantId=${tenantId}`
    );
    return response.data;
  }

  async update(id: string, tenantId: string, data: UpdateProfessionalData): Promise<Professional> {
    const response = await api.put<Professional>(
      `${API_ENDPOINTS.PROFESSIONAL(id)}?tenantId=${tenantId}`,
      data
    );
    return response.data;
  }

  async setAvailability(id: string, tenantId: string, data: { weeklySchedule: any }): Promise<void> {
    await api.post(
      `${API_ENDPOINTS.PROFESSIONAL_AVAILABILITY(id)}?tenantId=${tenantId}`,
      data
    );
  }

  async getAvailability(id: string, tenantId: string): Promise<any> {
    const response = await api.get(
      `${API_ENDPOINTS.PROFESSIONAL_AVAILABILITY(id)}?tenantId=${tenantId}`
    );
    return response.data;
  }
}

export const professionalService = new ProfessionalService();
