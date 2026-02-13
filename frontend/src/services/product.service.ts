import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Product } from '../types';

export interface CreateProductData {
  name: string;
  description?: string;
  durationMinutes: number;
  professionalId: string;
  tenantId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  durationMinutes?: number;
}

class ProductService {
  async create(data: CreateProductData): Promise<Product> {
    const response = await api.post<Product>(API_ENDPOINTS.PRODUCTS, data);
    return response.data;
  }

  async get(id: string, tenantId: string): Promise<Product> {
    const response = await api.get<Product>(
      `${API_ENDPOINTS.PRODUCT(id)}?tenantId=${tenantId}`
    );
    return response.data;
  }

  async list(tenantId: string, professionalId?: string, active?: boolean): Promise<Product[]> {
    let url = `${API_ENDPOINTS.PRODUCTS}?tenantId=${tenantId}`;
    if (professionalId) url += `&professionalId=${professionalId}`;
    if (active !== undefined) url += `&active=${active}`;
    
    const response = await api.get<Product[]>(url);
    return response.data;
  }

  async update(id: string, tenantId: string, data: UpdateProductData): Promise<Product> {
    const response = await api.put<Product>(
      `${API_ENDPOINTS.PRODUCT(id)}?tenantId=${tenantId}`,
      data
    );
    return response.data;
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.PRODUCT(id)}?tenantId=${tenantId}`);
  }
}

export const productService = new ProductService();
