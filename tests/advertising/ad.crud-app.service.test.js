"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ad_crud_app_service_1 = require("../../src/modules/advertising/application/services/ad.crud-app.service");
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
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
};
describe('AdCrudAppService', () => {
    let service;
    beforeEach(() => {
        jest.clearAllMocks();
        service = new ad_crud_app_service_1.AdCrudAppService(mockAdCrudRepository, mockLogger);
    });
    describe('createAd', () => {
        const validAdData = {
            titleEn: 'Test Ad',
            titleAr: 'إعلان تجريبي',
            descriptionEn: 'Test Description',
            descriptionAr: 'وصف تجريبي',
            targetAudience: 'Test Audience',
            budget: 100,
            status: 'draft',
            targetCities: ['riyadh'],
            startDate: new Date(),
            endDate: new Date(),
        };
        it('should create ad successfully and log the operation', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const userId = 'user-123';
            const expectedAdId = 'ad-456';
            mockAdCrudRepository.create.mockResolvedValue(expectedAdId);
            const result = yield service.createAd(validAdData, userId);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.AdId).toBe(expectedAdId);
            expect(mockAdCrudRepository.create).toHaveBeenCalledWith(Object.assign(Object.assign({}, validAdData), { userId }));
            // Verify logging
            expect(mockLogger.info).toHaveBeenCalledWith('Creating new ad', { userId, adTitle: 'Test Ad' });
            expect(mockLogger.info).toHaveBeenCalledWith('Ad created successfully', { adId: expectedAdId, userId });
        }));
        it('should log errors when ad creation fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const userId = 'user-123';
            const error = new Error('Database connection failed');
            mockAdCrudRepository.create.mockRejectedValue(error);
            const result = yield service.createAd(validAdData, userId);
            expect(result.success).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create ad', {
                userId,
                error: error.message,
                adData: validAdData
            });
        }));
    });
    describe('getAdById', () => {
        it('should return ad when found', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const mockAd = { id: adId, title: 'Test Ad' };
            mockAdCrudRepository.findById.mockResolvedValue(mockAd);
            const result = yield service.getAdById(adId);
            expect(result.success).toBe(true);
            expect(result.data).toBe(mockAd);
            expect(mockAdCrudRepository.findById).toHaveBeenCalledWith(adId);
        }));
        it('should return error when ad not found', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const adId = 'non-existent-ad';
            mockAdCrudRepository.findById.mockResolvedValue(null);
            const result = yield service.getAdById(adId);
            expect(result.success).toBe(false);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe('AD_NOT_FOUND');
            expect(mockAdCrudRepository.findById).toHaveBeenCalledWith(adId);
        }));
        it('should log errors when repository throws', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const error = new Error('Database error');
            mockAdCrudRepository.findById.mockRejectedValue(error);
            const result = yield service.getAdById(adId);
            expect(result.success).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch ad by ID', {
                adId,
                error: error.message
            });
        }));
    });
    describe('updateAd', () => {
        it('should update ad successfully and log the operation', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const updateData = { titleEn: 'Updated Title' };
            const mockUpdatedAd = Object.assign({ id: adId }, updateData);
            mockAdCrudRepository.update.mockResolvedValue(mockUpdatedAd);
            const result = yield service.updateAd(adId, updateData);
            expect(result.success).toBe(true);
            expect(result.data).toBe(mockUpdatedAd);
            expect(mockAdCrudRepository.update).toHaveBeenCalledWith(adId, updateData);
        }));
        it('should warn about invalid targetCities type', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const invalidUpdateData = {
                targetCities: 'invalid-string-instead-of-array' // Should be array
            };
            const result = yield service.updateAd(adId, invalidUpdateData);
            expect(result.success).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith('Invalid targetCities type received', {
                receivedType: 'string',
                receivedValue: 'invalid-string-instead-of-array',
                adId
            });
        }));
        it('should return error when ad not found for update', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const adId = 'non-existent-ad';
            const updateData = { titleEn: 'Updated Title' };
            mockAdCrudRepository.update.mockResolvedValue(null);
            const result = yield service.updateAd(adId, updateData);
            expect(result.success).toBe(false);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe('AD_NOT_FOUND');
        }));
        it('should log errors when update fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const updateData = { titleEn: 'Updated Title' };
            const error = new Error('Update failed');
            mockAdCrudRepository.update.mockRejectedValue(error);
            const result = yield service.updateAd(adId, updateData);
            expect(result.success).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update ad', {
                adId,
                error: error.message
            });
        }));
    });
    describe('deleteAd', () => {
        it('should delete ad successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const adId = 'ad-123';
            const userId = 'user-456';
            const role = 'admin';
            mockAdCrudRepository.delete.mockResolvedValue(true);
            const result = yield service.deleteAd(adId, userId, role);
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.deleted).toBe(true);
            expect(mockAdCrudRepository.delete).toHaveBeenCalledWith(adId, userId, role);
        }));
        it('should return error when ad not found for deletion', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const adId = 'non-existent-ad';
            const userId = 'user-456';
            const role = 'admin';
            mockAdCrudRepository.delete.mockResolvedValue(false);
            const result = yield service.deleteAd(adId, userId, role);
            expect(result.success).toBe(false);
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe('AD_NOT_FOUND');
        }));
        it('should log errors when deletion fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const adId = 'ad-123';
            const userId = 'user-456';
            const role = 'admin';
            const error = new Error('Deletion failed');
            mockAdCrudRepository.delete.mockRejectedValue(error);
            const result = yield service.deleteAd(adId, userId, role);
            expect(result.success).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete ad', {
                adId,
                userId,
                role,
                error: error.message
            });
        }));
    });
});
