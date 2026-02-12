import { DynamoDBKeys } from '../types';

// User keys
export const userKeys = (userId: string, tenantId: string): DynamoDBKeys => ({
  PK: `USER#${userId}`,
  SK: 'PROFILE',
  GSI1PK: `TENANT#${tenantId}`,
  GSI1SK: `USER#${userId}`,
});

// Professional keys
export const professionalKeys = (
  professionalId: string,
  tenantId: string
): DynamoDBKeys => ({
  PK: `TENANT#${tenantId}`,
  SK: `PROFESSIONAL#${professionalId}`,
  GSI1PK: `PROFESSIONAL#${professionalId}`,
  GSI1SK: 'METADATA',
});

// Patient keys
export const patientKeys = (patientId: string, tenantId: string): DynamoDBKeys => ({
  PK: `TENANT#${tenantId}`,
  SK: `PATIENT#${patientId}`,
  GSI1PK: `PATIENT#${patientId}`,
  GSI1SK: 'METADATA',
});

// Product keys
export const productKeys = (
  productId: string,
  tenantId: string,
  professionalId: string
): DynamoDBKeys => ({
  PK: `TENANT#${tenantId}`,
  SK: `PRODUCT#${productId}`,
  GSI1PK: `PROFESSIONAL#${professionalId}`,
  GSI1SK: `PRODUCT#${productId}`,
});

// Availability keys
export const availabilityKeys = (professionalId: string): DynamoDBKeys => ({
  PK: `PROFESSIONAL#${professionalId}`,
  SK: 'AVAILABILITY',
});

// Appointment keys
export const appointmentKeys = (
  appointmentId: string,
  tenantId: string,
  patientId: string,
  professionalId: string,
  dateTime: string
): DynamoDBKeys => ({
  PK: `TENANT#${tenantId}`,
  SK: `APPOINTMENT#${appointmentId}`,
  GSI1PK: `PATIENT#${patientId}`,
  GSI1SK: `APPOINTMENT#${dateTime}`,
  GSI2PK: `PROFESSIONAL#${professionalId}`,
  GSI2SK: `APPOINTMENT#${dateTime}`,
});

// Subscription keys
export const subscriptionKeys = (
  subscriptionId: string,
  tenantId: string
): DynamoDBKeys => ({
  PK: `TENANT#${tenantId}`,
  SK: 'SUBSCRIPTION',
  GSI1PK: `SUBSCRIPTION#${subscriptionId}`,
  GSI1SK: 'METADATA',
});
