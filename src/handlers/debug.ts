import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBRepository } from '../repositories/dynamodb.repository';
import { successResponse, validationError } from '../shared/utils/response';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('DebugHandlers');
const repository = new DynamoDBRepository();

/**
 * Check if user profile exists in DynamoDB
 * GET /debug/check-profile?email=user@example.com
 */
export const checkProfile = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return validationError('email query parameter is required');
    }

    logger.info('Checking profile for email', { email });

    // Search for user by email
    const result = await repository.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `EMAIL#${email}`,
      },
    });

    if (!result || result.length === 0) {
      // Try scanning (less efficient but works if GSI not set up)
      const scanResult = await repository.scan({
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });

      if (!scanResult || scanResult.length === 0) {
        return successResponse({
          found: false,
          message: 'User profile not found in DynamoDB',
          email,
        });
      }

      return successResponse({
        found: true,
        message: 'User profile found (via scan)',
        profile: scanResult[0],
      });
    }

    return successResponse({
      found: true,
      message: 'User profile found',
      profile: result[0],
    });
  } catch (error) {
    logger.error('Error checking profile', { error });
    return validationError('Failed to check profile');
  }
};
