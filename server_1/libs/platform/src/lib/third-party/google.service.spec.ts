import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import axios from 'axios';
// Now import after mocks
import { GoogleService } from './google.service';
import { AppConfigService, MstAdminUser } from '@server_1/core';
import { LogErrorService } from '../logging/log-error.service';
// Mock axios first
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock @eatfit247-shared-lib to provide ConfigParam
jest.mock('@eatfit247-shared-lib', () => ({
  ConfigParam: {
    GOOGLE_KEY: 'GOOGLE_KEY',
    GOOGLE_PLACE_ID: 'GOOGLE_PLACE_ID',
  },
}));

// Mock @server_1/core to avoid dependency issues
jest.mock('@server_1/core', () => {
  const mockMstAdminUser = class {};
  return {
    AppConfigService: jest.fn(),
    MstAdminUser: mockMstAdminUser,
  };
});

// Mock LogErrorService to avoid model dependency issues
jest.mock('../logging/log-error.service', () => ({
  LogErrorService: jest.fn().mockImplementation(() => ({
    logError: jest.fn(),
    logWarning: jest.fn(),
  })),
}));
describe('GoogleService - getGoogleBusinessReviews', () => {
  let service: GoogleService;
  let appConfigService: jest.Mocked<AppConfigService>;
  let logErrorService: jest.Mocked<LogErrorService>;

  beforeEach(async () => {
    const mockAppConfigService = {
      getString: jest.fn(),
      getNumber: jest.fn(),
    };

    const mockLogErrorService = {
      logError: jest.fn(),
      logWarning: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        {
          provide: LogErrorService,
          useValue: mockLogErrorService,
        },
        {
          provide: getModelToken(MstAdminUser),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
    appConfigService = module.get(AppConfigService);
    logErrorService = module.get(LogErrorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoogleBusinessReviews', () => {
    const mockApiKey = 'test-api-key';
    const mockPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    const mockGoogleResponse = {
      data: {
        status: 'OK',
        result: {
          place_id: mockPlaceId,
          name: 'Test Business',
          rating: 4.5,
          user_ratings_total: 100,
          reviews: [
            {
              author_name: 'John Doe',
              author_url: 'https://www.google.com/maps/contrib/123',
              profile_photo_url: 'https://lh3.googleusercontent.com/photo.jpg',
              rating: 5,
              text: 'Great service!',
              time: 1609459200, // 2021-01-01 00:00:00 UTC
            },
            {
              author_name: 'Jane Smith',
              author_url: 'https://www.google.com/maps/contrib/456',
              profile_photo_url: 'https://lh3.googleusercontent.com/photo2.jpg',
              rating: 4,
              text: 'Good experience',
              time: 1609545600, // 2021-01-02 00:00:00 UTC
            },
            {
              author_name: 'Anonymous User',
              rating: 3,
              text: 'Average',
              time: 1609632000, // 2021-01-03 00:00:00 UTC
            },
          ],
        },
      },
    };

    it('should successfully fetch and transform Google Business reviews', async () => {
      // Arrange
      appConfigService.getString.mockImplementation((key: string | any) => {
        // ConfigParam.GOOGLE_KEY evaluates to 'GOOGLE_KEY'
        const keyStr = String(key);
        if (keyStr === 'GOOGLE_KEY') return mockApiKey;
        if (keyStr === 'GOOGLE_PLACE_ID') return mockPlaceId;
        return undefined;
      });
      mockedAxios.get.mockResolvedValue(mockGoogleResponse);

      // Act
      const result = await service.getGoogleBusinessReviews();

      // Assert
      expect(result).toBeDefined();
      expect(result.reviews).toHaveLength(3);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviewCount).toBe(100);

      // Check first review
      expect(result.reviews[0]).toMatchObject({
        reviewId: 'https://www.google.com/maps/contrib/123',
        reviewer: {
          displayName: 'John Doe',
          profilePhotoUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        },
        starRating: 'FIVE',
        comment: 'Great service!',
      });
      expect(result.reviews[0].createTime).toBe('2021-01-01T00:00:00.000Z');

      // Check second review
      expect(result.reviews[1]).toMatchObject({
        reviewId: 'https://www.google.com/maps/contrib/456',
        reviewer: {
          displayName: 'Jane Smith',
          profilePhotoUrl: 'https://lh3.googleusercontent.com/photo2.jpg',
        },
        starRating: 'FOUR',
        comment: 'Good experience',
      });

      // Check third review (without author_url)
      expect(result.reviews[2].reviewId).toContain(`review-${mockPlaceId}-2`);
      expect(result.reviews[2].reviewer.displayName).toBe('Anonymous User');
      expect(result.reviews[2].starRating).toBe('THREE');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: mockPlaceId,
            fields: 'place_id,name,rating,user_ratings_total,reviews',
            key: mockApiKey,
          },
        },
      );
    });

    it('should use provided placeId parameter instead of config', async () => {
      // Arrange
      const customPlaceId = 'custom-place-id';
      appConfigService.getString.mockReturnValue(mockApiKey);
      mockedAxios.get.mockResolvedValue(mockGoogleResponse);

      // Act
      await service.getGoogleBusinessReviews(customPlaceId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            place_id: customPlaceId,
          }),
        }),
      );
    });

    it('should throw BadRequestException when API key is not configured', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(undefined);

      // Act & Assert
      await expect(service.getGoogleBusinessReviews()).rejects.toThrow(
        new BadRequestException('Google API key is not configured'),
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Place ID is not provided', async () => {
      // Arrange
      appConfigService.getString.mockImplementation((key: string) => {
        if (key === 'GOOGLE_KEY') return mockApiKey;
        return undefined;
      });

      // Act & Assert
      await expect(service.getGoogleBusinessReviews()).rejects.toThrow(
        new BadRequestException('Google Place ID is required'),
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Google API returns non-OK status', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const errorResponse = {
        data: {
          status: 'INVALID_REQUEST',
          error_message: 'Invalid place_id',
        },
      };
      mockedAxios.get.mockResolvedValue(errorResponse);

      // Act & Assert
      await expect(service.getGoogleBusinessReviews(mockPlaceId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getGoogleBusinessReviews(mockPlaceId)).rejects.toThrow(
        'Google Places API error: INVALID_REQUEST - Invalid place_id',
      );
      expect(logErrorService.logError).toHaveBeenCalled();
    });

    it('should handle API errors and log them', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const networkError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.getGoogleBusinessReviews(mockPlaceId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getGoogleBusinessReviews(mockPlaceId)).rejects.toThrow(
        'Failed to fetch Google Business reviews: Network error',
      );
      expect(logErrorService.logError).toHaveBeenCalledWith(
        'Failed to fetch Google Business reviews: Network error',
        {
          controller: 'GoogleService',
          methodName: 'getGoogleBusinessReviews',
        },
      );
    });

    it('should handle reviews with missing optional fields', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const responseWithMinimalData = {
        data: {
          status: 'OK',
          result: {
            place_id: mockPlaceId,
            rating: 4.0,
            user_ratings_total: 50,
            reviews: [
              {
                author_name: 'Test User',
                rating: 5,
                // Missing: author_url, profile_photo_url, text, time
              },
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(responseWithMinimalData);

      // Act
      const result = await service.getGoogleBusinessReviews(mockPlaceId);

      // Assert
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].reviewId).toContain(`review-${mockPlaceId}-0`);
      expect(result.reviews[0].reviewer.displayName).toBe('Test User');
      expect(result.reviews[0].reviewer.profilePhotoUrl).toBeUndefined();
      expect(result.reviews[0].comment).toBeUndefined();
      expect(result.reviews[0].starRating).toBe('FIVE');
      expect(result.reviews[0].createTime).toBeDefined();
      expect(result.reviews[0].updateTime).toBeDefined();
    });

    it('should handle empty reviews array', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const responseWithNoReviews = {
        data: {
          status: 'OK',
          result: {
            place_id: mockPlaceId,
            rating: 4.0,
            user_ratings_total: 0,
            reviews: [],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(responseWithNoReviews);

      // Act
      const result = await service.getGoogleBusinessReviews(mockPlaceId);

      // Assert
      expect(result.reviews).toHaveLength(0);
      expect(result.averageRating).toBe(4.0);
      expect(result.totalReviewCount).toBe(0);
    });

    it('should map all rating values correctly', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const responseWithAllRatings = {
        data: {
          status: 'OK',
          result: {
            place_id: mockPlaceId,
            reviews: [
              { author_name: 'User1', rating: 1, text: 'One star', time: 1609459200 },
              { author_name: 'User2', rating: 2, text: 'Two stars', time: 1609459200 },
              { author_name: 'User3', rating: 3, text: 'Three stars', time: 1609459200 },
              { author_name: 'User4', rating: 4, text: 'Four stars', time: 1609459200 },
              { author_name: 'User5', rating: 5, text: 'Five stars', time: 1609459200 },
              { author_name: 'User6', rating: 99, text: 'Invalid rating', time: 1609459200 }, // Should default to FIVE
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(responseWithAllRatings);

      // Act
      const result = await service.getGoogleBusinessReviews(mockPlaceId);

      // Assert
      expect(result.reviews[0].starRating).toBe('ONE');
      expect(result.reviews[1].starRating).toBe('TWO');
      expect(result.reviews[2].starRating).toBe('THREE');
      expect(result.reviews[3].starRating).toBe('FOUR');
      expect(result.reviews[4].starRating).toBe('FIVE');
      expect(result.reviews[5].starRating).toBe('FIVE'); // Default for invalid rating
    });

    it('should handle reviews without time field', async () => {
      // Arrange
      appConfigService.getString.mockReturnValue(mockApiKey);
      const responseWithoutTime = {
        data: {
          status: 'OK',
          result: {
            place_id: mockPlaceId,
            reviews: [
              {
                author_name: 'User',
                rating: 5,
                text: 'Review without time',
                // Missing time field
              },
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(responseWithoutTime);

      // Act
      const result = await service.getGoogleBusinessReviews(mockPlaceId);

      // Assert
      expect(result.reviews[0].createTime).toBeDefined();
      expect(result.reviews[0].updateTime).toBeDefined();
      // Should be current time ISO string (approximately)
      const createTime = new Date(result.reviews[0].createTime);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - createTime.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });
  });
});

