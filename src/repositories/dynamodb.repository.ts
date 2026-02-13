import {
  DynamoDBClient,
  TransactWriteItemsCommand,
  TransactWriteItem,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { createLogger } from '../shared/utils/logger';
import { RepositoryError, EntityNotFoundError } from './types';
import { DynamoDBKeys } from '../shared/types';

const logger = createLogger('DynamoDBRepository');

export class DynamoDBRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });

    this.tableName = process.env.TABLE_NAME!;

    if (!this.tableName) {
      throw new Error('TABLE_NAME environment variable is required');
    }
  }

  /**
   * Put item in DynamoDB
   * Validates: Requirements 2.1, 12.1
   */
  async put<T extends DynamoDBKeys>(item: T): Promise<T> {
    logger.debug('Putting item', { PK: item.PK, SK: item.SK });

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...item,
          updatedAt: new Date().toISOString(),
        },
      });

      await this.docClient.send(command);

      logger.info('Item put successfully', { PK: item.PK, SK: item.SK });

      return item;
    } catch (error: any) {
      logger.error('Failed to put item', error, { 
        PK: item.PK, 
        SK: item.SK,
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
      });
      throw new RepositoryError(`Failed to put item: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get item from DynamoDB
   * Validates: Requirements 2.1, 12.2
   */
  async get<T extends DynamoDBKeys>(PK: string, SK: string): Promise<T | null> {
    logger.debug('Getting item', { PK, SK });

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { PK, SK },
      });

      const response = await this.docClient.send(command);

      if (!response.Item) {
        logger.debug('Item not found', { PK, SK });
        return null;
      }

      logger.debug('Item retrieved successfully', { PK, SK });

      return response.Item as T;
    } catch (error) {
      logger.error('Failed to get item', error, { PK, SK });
      throw new RepositoryError('Failed to get item');
    }
  }

  /**
   * Query items from DynamoDB
   * Validates: Requirements 12.2, 12.5
   */
  async query<T extends DynamoDBKeys>(
    keyCondition: string,
    expressionValues: Record<string, unknown>,
    options?: {
      indexName?: string;
      limit?: number;
      scanIndexForward?: boolean;
      filterExpression?: string;
    }
  ): Promise<T[]> {
    logger.debug('Querying items', { keyCondition, indexName: options?.indexName });

    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
        IndexName: options?.indexName,
        Limit: options?.limit,
        ScanIndexForward: options?.scanIndexForward ?? true,
        FilterExpression: options?.filterExpression,
      });

      const response = await this.docClient.send(command);

      logger.debug('Query completed', {
        count: response.Items?.length || 0,
        indexName: options?.indexName,
      });

      return (response.Items || []) as T[];
    } catch (error) {
      logger.error('Failed to query items', error, { keyCondition });
      throw new RepositoryError('Failed to query items');
    }
  }

  /**
   * Update item in DynamoDB
   * Validates: Requirements 2.1
   */
  async update<T extends DynamoDBKeys>(
    PK: string,
    SK: string,
    updates: Partial<T>
  ): Promise<T> {
    logger.debug('Updating item', { PK, SK });

    try {
      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        if (key !== 'PK' && key !== 'SK') {
          const nameKey = `#attr${index}`;
          const valueKey = `:val${index}`;
          updateExpressions.push(`${nameKey} = ${valueKey}`);
          expressionAttributeNames[nameKey] = key;
          expressionAttributeValues[valueKey] = value;
        }
      });

      // Add updatedAt
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { PK, SK },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.docClient.send(command);

      logger.info('Item updated successfully', { PK, SK });

      return response.Attributes as T;
    } catch (error) {
      logger.error('Failed to update item', error, { PK, SK });
      throw new RepositoryError('Failed to update item');
    }
  }

  /**
   * Delete item from DynamoDB
   * Validates: Requirements 15.3
   */
  async delete(PK: string, SK: string): Promise<void> {
    logger.debug('Deleting item', { PK, SK });

    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { PK, SK },
      });

      await this.docClient.send(command);

      logger.info('Item deleted successfully', { PK, SK });
    } catch (error) {
      logger.error('Failed to delete item', error, { PK, SK });
      throw new RepositoryError('Failed to delete item');
    }
  }

  /**
   * Transactional write - ensures atomicity
   * Validates: Requirements 14.2
   */
  async transactWrite(items: TransactWriteItem[]): Promise<void> {
    logger.debug('Executing transaction', { itemCount: items.length });

    try {
      const command = new TransactWriteItemsCommand({
        TransactItems: items,
      });

      await this.docClient.send(command);

      logger.info('Transaction completed successfully', { itemCount: items.length });
    } catch (error: unknown) {
      logger.error('Transaction failed', error);

      if (error && typeof error === 'object' && 'name' in error && error.name === 'TransactionCanceledException') {
        throw new RepositoryError('Transaction cancelled - possible conflict');
      }

      throw new RepositoryError('Transaction failed');
    }
  }

  /**
   * Batch write items
   */
  async batchWrite<T extends DynamoDBKeys>(items: T[]): Promise<void> {
    logger.debug('Batch writing items', { count: items.length });

    try {
      // DynamoDB batch write limit is 25 items
      const batches = this.chunkArray(items, 25);

      for (const batch of batches) {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch.map((item) => ({
              PutRequest: {
                Item: {
                  ...item,
                  updatedAt: new Date().toISOString(),
                },
              },
            })),
          },
        });

        await this.docClient.send(command);
      }

      logger.info('Batch write completed', { totalItems: items.length });
    } catch (error) {
      logger.error('Batch write failed', error);
      throw new RepositoryError('Batch write failed');
    }
  }

  /**
   * Check if item exists
   */
  async exists(PK: string, SK: string): Promise<boolean> {
    const item = await this.get(PK, SK);
    return item !== null;
  }

  /**
   * Get or throw error if not found
   */
  async getOrThrow<T extends DynamoDBKeys>(
    PK: string,
    SK: string,
    entityType: string
  ): Promise<T> {
    const item = await this.get<T>(PK, SK);

    if (!item) {
      throw new EntityNotFoundError(entityType, `${PK}#${SK}`);
    }

    return item;
  }

  /**
   * Helper to chunk array for batch operations
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const dynamoDBRepository = new DynamoDBRepository();
