import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { productService } from '../services/product/product.service';
import { successResponse, validationError, notFoundError, internalError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';
import { ValidationError } from '../shared/utils/validation';
import { EntityNotFoundError } from '../repositories/types';

const logger = createLogger('ProductHandlers');

/**
 * Create a new product
 * POST /products
 */
export const createProduct = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('Create product request', { path: event.rawPath });

    if (!event.body) {
      return validationError('Request body is required');
    }

    const input = JSON.parse(event.body);
    const product = await productService.createProduct(input);

    return successResponse(product, 201);
  } catch (error) {
    logger.error('Error creating product', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Get product by ID
 * GET /products/{id}
 */
export const getProduct = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const productId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Get product request', { productId, tenantId });

    if (!productId || !tenantId) {
      return validationError('productId and tenantId are required');
    }

    const product = await productService.getProduct(productId, tenantId);

    return successResponse(product);
  } catch (error) {
    logger.error('Error getting product', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};

/**
 * List products
 * GET /products
 */
export const listProducts = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const tenantId = event.queryStringParameters?.tenantId;
    const professionalId = event.queryStringParameters?.professionalId;
    const active = event.queryStringParameters?.active;
    const limit = event.queryStringParameters?.limit;

    logger.info('List products request', { tenantId, professionalId, active, limit });

    if (!tenantId) {
      return validationError('tenantId is required');
    }

    const filters = {
      tenantId,
      professionalId,
      active: active !== undefined ? active === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    logger.info('Calling productService.listProducts with filters', { filters });

    const products = await productService.listProducts(filters);

    logger.info('Products retrieved successfully', { count: products.length });

    return successResponse({ products, count: products.length });
  } catch (error: any) {
    logger.error('Error listing products', { 
      error, 
      message: error?.message, 
      stack: error?.stack,
      name: error?.name 
    });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return internalError();
  }
};

/**
 * Update product
 * PUT /products/{id}
 */
export const updateProduct = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const productId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Update product request', { productId, tenantId });

    if (!productId || !tenantId) {
      return validationError('productId and tenantId are required');
    }

    if (!event.body) {
      return validationError('Request body is required');
    }

    const updates = JSON.parse(event.body);
    const product = await productService.updateProduct(productId, tenantId, updates);

    return successResponse(product);
  } catch (error) {
    logger.error('Error updating product', { error });

    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};

/**
 * Deactivate product (soft delete)
 * DELETE /products/{id}
 */
export const deactivateProduct = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const productId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId;

    logger.info('Deactivate product request', { productId, tenantId });

    if (!productId || !tenantId) {
      return validationError('productId and tenantId are required');
    }

    await productService.deactivateProduct(productId, tenantId);

    return successResponse({ message: 'Product deactivated successfully' });
  } catch (error) {
    logger.error('Error deactivating product', { error });

    if (error instanceof EntityNotFoundError) {
      return notFoundError(error.message);
    }

    return internalError();
  }
};
