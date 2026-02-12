import { v4 as uuidv4 } from 'uuid';
import { dynamoDBRepository } from '../../repositories/dynamodb.repository';
import { createLogger } from '../../shared/utils/logger';
import { validateRequired, validatePositiveNumber } from '../../shared/utils/validation';
import { productKeys } from '../../shared/utils/dynamodb-keys';
import { Product } from '../../shared/types';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  ProductEntity,
  EntityNotFoundError,
} from '../../repositories/types';

const logger = createLogger('ProductService');

export class ProductService {
  /**
   * Create a new product
   * Validates: Requirements 3.1, 3.4
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    logger.info('Creating product', {
      name: input.name,
      professionalId: input.professionalId,
      tenantId: input.tenantId,
    });

    // Validate required fields
    validateRequired(input.name, 'name');
    validateRequired(input.description, 'description');
    validateRequired(input.durationMinutes, 'durationMinutes');
    validateRequired(input.professionalId, 'professionalId');
    validateRequired(input.tenantId, 'tenantId');

    // Validate duration is positive
    validatePositiveNumber(input.durationMinutes, 'durationMinutes');

    const productId = input.productId || uuidv4();
    const now = new Date().toISOString();

    // Create product entity
    const productData: Product = {
      productId,
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    // Add DynamoDB keys
    const productEntity: ProductEntity = {
      ...productData,
      ...productKeys(productId, input.tenantId, input.professionalId),
    };

    await dynamoDBRepository.put(productEntity);

    logger.info('Product created successfully', { productId, tenantId: input.tenantId });

    return productData;
  }

  /**
   * Get product by ID
   * Validates: Requirements 3.1, 12.2
   */
  async getProduct(productId: string, tenantId: string): Promise<Product> {
    logger.debug('Getting product', { productId, tenantId });

    validateRequired(productId, 'productId');
    validateRequired(tenantId, 'tenantId');

    const productEntities = await dynamoDBRepository.query<ProductEntity>(
      'PK = :pk AND SK = :sk',
      {
        ':pk': `TENANT#${tenantId}`,
        ':sk': `PRODUCT#${productId}`,
      }
    );

    if (productEntities.length === 0) {
      throw new EntityNotFoundError('Product', productId);
    }

    const productEntity = productEntities[0];

    const product: Product = {
      productId: productEntity.productId,
      tenantId: productEntity.tenantId,
      professionalId: productEntity.professionalId,
      name: productEntity.name,
      description: productEntity.description,
      durationMinutes: productEntity.durationMinutes,
      active: productEntity.active,
      createdAt: productEntity.createdAt,
      updatedAt: productEntity.updatedAt,
    };

    logger.debug('Product retrieved successfully', { productId });

    return product;
  }

  /**
   * List products
   * Validates: Requirements 3.2, 3.3, 12.2
   */
  async listProducts(filters: ProductFilters): Promise<Product[]> {
    logger.debug('Listing products', {
      tenantId: filters.tenantId,
      professionalId: filters.professionalId,
    });

    validateRequired(filters.tenantId, 'tenantId');

    let productEntities: ProductEntity[];

    if (filters.professionalId) {
      // Query by professional using GSI1
      productEntities = await dynamoDBRepository.query<ProductEntity>(
        'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
        {
          ':gsi1pk': `PROFESSIONAL#${filters.professionalId}`,
          ':gsi1sk': 'PRODUCT#',
        },
        {
          indexName: 'GSI1',
          limit: filters.limit,
          scanIndexForward: filters.sortAscending,
        }
      );
    } else {
      // Query by tenant
      productEntities = await dynamoDBRepository.query<ProductEntity>(
        'PK = :pk AND begins_with(SK, :sk)',
        {
          ':pk': `TENANT#${filters.tenantId}`,
          ':sk': 'PRODUCT#',
        },
        {
          limit: filters.limit,
          scanIndexForward: filters.sortAscending,
        }
      );
    }

    // Filter by active status if specified
    let filteredProducts = productEntities;
    if (filters.active !== undefined) {
      filteredProducts = productEntities.filter((p) => p.active === filters.active);
    }

    const products = filteredProducts.map((entity) => ({
      productId: entity.productId,
      tenantId: entity.tenantId,
      professionalId: entity.professionalId,
      name: entity.name,
      description: entity.description,
      durationMinutes: entity.durationMinutes,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));

    logger.debug('Products listed successfully', { count: products.length });

    return products;
  }

  /**
   * Update product
   * Validates: Requirements 3.1, 3.4
   */
  async updateProduct(
    productId: string,
    tenantId: string,
    updates: UpdateProductInput
  ): Promise<Product> {
    logger.info('Updating product', { productId, tenantId });

    validateRequired(productId, 'productId');
    validateRequired(tenantId, 'tenantId');

    // Validate duration if provided
    if (updates.durationMinutes !== undefined) {
      validatePositiveNumber(updates.durationMinutes, 'durationMinutes');
    }

    // Check if product exists
    const existingProduct = await this.getProduct(productId, tenantId);

    const keys = productKeys(productId, tenantId, existingProduct.professionalId);
    const updatedEntity = await dynamoDBRepository.update<ProductEntity>(
      keys.PK,
      keys.SK,
      updates
    );

    const product: Product = {
      productId: updatedEntity.productId,
      tenantId: updatedEntity.tenantId,
      professionalId: updatedEntity.professionalId,
      name: updatedEntity.name,
      description: updatedEntity.description,
      durationMinutes: updatedEntity.durationMinutes,
      active: updatedEntity.active,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
    };

    logger.info('Product updated successfully', { productId });

    return product;
  }

  /**
   * Deactivate product (soft delete)
   * Validates: Requirements 3.5
   */
  async deactivateProduct(productId: string, tenantId: string): Promise<void> {
    logger.info('Deactivating product', { productId, tenantId });

    validateRequired(productId, 'productId');
    validateRequired(tenantId, 'tenantId');

    await this.updateProduct(productId, tenantId, { active: false });

    logger.info('Product deactivated successfully', { productId });
  }
}

// Export singleton instance
export const productService = new ProductService();
