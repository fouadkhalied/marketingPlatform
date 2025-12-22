import { AdCrudAppService } from '../../src/modules/advertising/application/services/ad.crud-app.service';
import { ILogger } from '../../src/infrastructure/shared/common/logging';

// Mock the schema validation to always pass
jest.mock('../../src/infrastructure/shared/schema/schema', () => ({
  createAdSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true }),
  },
}));

// Mock the repository
const mockAdCrudRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByTitle: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Mock the logger
const mockLogger: ILogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

describe('AdCrudAppService', () => {
  let service: AdCrudAppService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdCrudAppService(mockAdCrudRepository as any, mockLogger);
  });

  describe('createAd', () => {
    const validAdData = {
      titleEn: 'Test Ad',
      titleAr: 'إعلان تجريبي',
      descriptionEn: 'Test Description',
      descriptionAr: 'وصف تجريبي',
      targetAudience: 'Test Audience' as any,
      budget: 100,
      status: 'draft' as any,
      targetCities: ['riyadh'] as any,
      startDate: new Date(),
      endDate: new Date(),
    };

    it('should create ad successfully and log the operation', async () => {
      const userId = 'user-123';
      const expectedAdId = 'ad-456';

      mockAdCrudRepository.create.mockResolvedValue(expectedAdId);

      const result = await service.createAd(validAdData, userId);

      expect(result.success).toBe(true);
      expect(result.data?.AdId).toBe(expectedAdId);
      expect(mockAdCrudRepository.create).toHaveBeenCalledWith({ ...validAdData, userId });

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new ad', { userId, adTitle: 'Test Ad' });
      expect(mockLogger.info).toHaveBeenCalledWith('Ad created successfully', { adId: expectedAdId, userId });
    });


    it('should log errors when ad creation fails', async () => {
      const userId = 'user-123';
      const error = new Error('Database connection failed');

      mockAdCrudRepository.create.mockRejectedValue(error);

      const result = await service.createAd(validAdData, userId);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create ad', {
        userId,
        error: error.message,
        adData: validAdData
      });
    });
  });

  describe('getAdById', () => {
    it('should return ad when found', async () => {
      const adId = 'ad-123';
      const mockAd = { id: adId, title: 'Test Ad' };

      mockAdCrudRepository.findById.mockResolvedValue(mockAd);

      const result = await service.getAdById(adId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockAd);
      expect(mockAdCrudRepository.findById).toHaveBeenCalledWith(adId);
    });

    it('should return error when ad not found', async () => {
      const adId = 'non-existent-ad';

      mockAdCrudRepository.findById.mockResolvedValue(null);

      const result = await service.getAdById(adId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AD_NOT_FOUND');
      expect(mockAdCrudRepository.findById).toHaveBeenCalledWith(adId);
    });

    it('should log errors when repository throws', async () => {
      const adId = 'ad-123';
      const error = new Error('Database error');

      mockAdCrudRepository.findById.mockRejectedValue(error);

      const result = await service.getAdById(adId);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch ad by ID', {
        adId,
        error: error.message
      });
    });
  });

  describe('updateAd', () => {
    it('should update ad successfully and log the operation', async () => {
      const adId = 'ad-123';
      const updateData = { titleEn: 'Updated Title' } as any;
      const mockUpdatedAd = { id: adId, ...updateData };

      mockAdCrudRepository.update.mockResolvedValue(mockUpdatedAd);

      const result = await service.updateAd(adId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockUpdatedAd);
      expect(mockAdCrudRepository.update).toHaveBeenCalledWith(adId, updateData);
    });

    it('should warn about invalid targetCities type', async () => {
      const adId = 'ad-123';
      const invalidUpdateData = {
        targetCities: 'invalid-string-instead-of-array' // Should be array
      } as any;

      const result = await service.updateAd(adId, invalidUpdateData);

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid targetCities type received', {
        receivedType: 'string',
        receivedValue: 'invalid-string-instead-of-array',
        adId
      });
    });

    it('should return error when ad not found for update', async () => {
      const adId = 'non-existent-ad';
      const updateData = { titleEn: 'Updated Title' } as any;

      mockAdCrudRepository.update.mockResolvedValue(null);

      const result = await service.updateAd(adId, updateData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AD_NOT_FOUND');
    });

    it('should log errors when update fails', async () => {
      const adId = 'ad-123';
      const updateData = { titleEn: 'Updated Title' } as any;
      const error = new Error('Update failed');

      mockAdCrudRepository.update.mockRejectedValue(error);

      const result = await service.updateAd(adId, updateData);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update ad', {
        adId,
        error: error.message
      });
    });
  });

  describe('deleteAd', () => {
    it('should delete ad successfully', async () => {
      const adId = 'ad-123';
      const userId = 'user-456';
      const role = 'admin';

      mockAdCrudRepository.delete.mockResolvedValue(true);

      const result = await service.deleteAd(adId, userId, role);

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);
      expect(mockAdCrudRepository.delete).toHaveBeenCalledWith(adId, userId, role);
    });

    it('should return error when ad not found for deletion', async () => {
      const adId = 'non-existent-ad';
      const userId = 'user-456';
      const role = 'admin';

      mockAdCrudRepository.delete.mockResolvedValue(false);

      const result = await service.deleteAd(adId, userId, role);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AD_NOT_FOUND');
    });

    it('should log errors when deletion fails', async () => {
      const adId = 'ad-123';
      const userId = 'user-456';
      const role = 'admin';
      const error = new Error('Deletion failed');

      mockAdCrudRepository.delete.mockRejectedValue(error);

      const result = await service.deleteAd(adId, userId, role);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete ad', {
        adId,
        userId,
        role,
        error: error.message
      });
    });
  });
});
