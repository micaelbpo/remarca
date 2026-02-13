export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  VALIDATE: '/auth/validate',
  REFRESH: '/auth/refresh',
  
  // Patients
  PATIENTS: '/patients',
  PATIENT: (id: string) => `/patients/${id}`,
  
  // Professionals
  PROFESSIONALS: '/professionals',
  PROFESSIONAL: (id: string) => `/professionals/${id}`,
  PROFESSIONAL_AVAILABILITY: (id: string) => `/professionals/${id}/availability`,
  
  // Products
  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${id}`,
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT: (id: string) => `/appointments/${id}`,
  APPOINTMENT_RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
  APPOINTMENT_CANCEL: (id: string) => `/appointments/${id}/cancel`,
  
  // Availability
  AVAILABILITY: '/availability',
  AVAILABILITY_CHECK: '/availability/check',
} as const;
