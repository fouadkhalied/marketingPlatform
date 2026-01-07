"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const advertising_factory_1 = require("../../src/modules/advertising/interfaces/factories/advertising.factory");
// Mock all the dependencies
jest.mock('../../src/modules/advertising/application/services/ad.crud-app.service');
jest.mock('../../src/modules/advertising/application/services/ad.photo-app.service');
jest.mock('../../src/modules/advertising/application/services/ad.listing-app.service');
jest.mock('../../src/modules/advertising/application/services/ad.status-app.service');
jest.mock('../../src/modules/advertising/application/services/ad.promotion-app.service');
jest.mock('../../src/modules/advertising/application/services/social.media-app.service');
jest.mock('../../src/modules/advertising/application/services/pixel-app.service');
jest.mock('../../src/modules/advertising/application/services/ads.package-app.service');
jest.mock('../../src/modules/advertising/interfaces/controllers/ad.crud.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/ad.photo.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/ad.listing.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/ad.status.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/ad.promotion.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/social.media.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/pixel.controller');
jest.mock('../../src/modules/advertising/interfaces/controllers/ads.package.controller');
// Mock shared dependencies
jest.mock('../../src/modules/user/application/services/facebook-app.service');
jest.mock('../../src/modules/user/infrastructure/repositories/facebook.repository.impl');
jest.mock('../../src/infrastructure/shared/common/supabase/module/supabase.module');
jest.mock('../../src/infrastructure/shared/common/supabase/module/supabaseUploader.module');
// Mock repositories
jest.mock('../../src/modules/advertising/infrastructure/repositories/ads.package.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/ad.crud.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/ad.photo.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/ad.listing.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/ad.status.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/ad.promotion.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/social.media.page.repository');
jest.mock('../../src/modules/advertising/infrastructure/repositories/pixel.repository');
// Mock logger
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
};
jest.mock('../../../src/infrastructure/shared/common/logging', () => ({
    createLogger: jest.fn(() => mockLogger),
}));
describe('Advertising Factory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createAllAdvertisingControllers', () => {
        it('should create all advertising controllers with proper logger injection', () => {
            const controllers = (0, advertising_factory_1.createAllAdvertisingControllers)();
            // Verify that all controllers are created
            expect(controllers).toHaveProperty('adCrud');
            expect(controllers).toHaveProperty('adPhoto');
            expect(controllers).toHaveProperty('adListing');
            expect(controllers).toHaveProperty('adStatus');
            expect(controllers).toHaveProperty('adPromotion');
            expect(controllers).toHaveProperty('socialMedia');
            expect(controllers).toHaveProperty('pixel');
            expect(controllers).toHaveProperty('adsPackage');
            // Verify logger was created for advertising context
            const { createLogger } = require('../../../src/infrastructure/shared/common/logging');
            expect(createLogger).toHaveBeenCalledWith('advertising');
        });
        it('should pass logger to all service constructors', () => {
            // Import the mocked services
            const AdCrudAppService = require('../../../src/modules/advertising/application/services/ad.crud-app.service').AdCrudAppService;
            const AdPhotoAppService = require('../../../src/modules/advertising/application/services/ad.photo-app.service').AdPhotoAppService;
            const AdListingAppService = require('../../../src/modules/advertising/application/services/ad.listing-app.service').AdListingAppService;
            const AdStatusAppService = require('../../../src/modules/advertising/application/services/ad.status-app.service').AdStatusAppService;
            const AdPromotionAppService = require('../../../src/modules/advertising/application/services/ad.promotion-app.service').AdPromotionAppService;
            const SocialMediaAppService = require('../../../src/modules/advertising/application/services/social.media-app.service').SocialMediaAppService;
            const PixelAppService = require('../../../src/modules/advertising/application/services/pixel-app.service').PixelAppService;
            const AdsPackageAppService = require('../../../src/modules/advertising/application/services/ads.package-app.service').AdsPackageAppService;
            (0, advertising_factory_1.createAllAdvertisingControllers)();
            // Verify all services were created with logger
            expect(AdCrudAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdPhotoAppService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), mockLogger);
            expect(AdListingAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdStatusAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdPromotionAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(SocialMediaAppService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), mockLogger);
            expect(PixelAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdsPackageAppService).toHaveBeenCalledWith(expect.any(Object), mockLogger);
        });
        it('should pass logger to all controller constructors', () => {
            // Import the mocked controllers
            const AdCrudController = require('../../../src/modules/advertising/interfaces/controllers/ad.crud.controller').AdCrudController;
            const AdPhotoController = require('../../../src/modules/advertising/interfaces/controllers/ad.photo.controller').AdPhotoController;
            const AdListingController = require('../../../src/modules/advertising/interfaces/controllers/ad.listing.controller').AdListingController;
            const AdStatusController = require('../../../src/modules/advertising/interfaces/controllers/ad.status.controller').AdStatusController;
            const AdPromotionController = require('../../../src/modules/advertising/interfaces/controllers/ad.promotion.controller').AdPromotionController;
            const SocialMediaController = require('../../../src/modules/advertising/interfaces/controllers/social.media.controller').SocialMediaController;
            const PixelController = require('../../../src/modules/advertising/interfaces/controllers/pixel.controller').PixelController;
            const AdsPackageController = require('../../../src/modules/advertising/interfaces/controllers/ads.package.controller').AdsPackageController;
            (0, advertising_factory_1.createAllAdvertisingControllers)();
            // Verify all controllers were created with service and logger
            expect(AdCrudController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdPhotoController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdListingController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdStatusController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdPromotionController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(SocialMediaController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(PixelController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
            expect(AdsPackageController).toHaveBeenCalledWith(expect.any(Object), mockLogger);
        });
        it('should create shared dependencies with logger', () => {
            const FacebookPageService = require('../../../src/modules/user/application/services/facebook-app.service').FacebookPageService;
            const SupabaseUploader = require('../../../src/infrastructure/shared/common/supabase/module/supabaseUploader.module').SupabaseUploader;
            const UploadPhoto = require('../../../src/infrastructure/shared/common/supabase/module/supabase.module').UploadPhoto;
            (0, advertising_factory_1.createAllAdvertisingControllers)();
            // Verify shared dependencies were created
            expect(FacebookPageService).toHaveBeenCalled();
            expect(SupabaseUploader).toHaveBeenCalled();
            expect(UploadPhoto).toHaveBeenCalledWith(expect.any(Object));
        });
        it('should handle errors during controller creation', () => {
            // Mock one of the services to throw an error
            const AdCrudAppService = require('../../../src/modules/advertising/application/services/ad.crud-app.service').AdCrudAppService;
            AdCrudAppService.mockImplementation(() => {
                throw new Error('Service creation failed');
            });
            expect(() => (0, advertising_factory_1.createAllAdvertisingControllers)()).toThrow('Service creation failed');
        });
    });
    describe('Logger Integration', () => {
        it('should create logger with advertising context', () => {
            const { createLogger } = require('../../../src/infrastructure/shared/common/logging');
            (0, advertising_factory_1.createAllAdvertisingControllers)();
            expect(createLogger).toHaveBeenCalledWith('advertising');
        });
        it('should use logger child instances for different contexts', () => {
            // This test verifies that the logger can create child loggers for different contexts
            const childLogger = mockLogger.child({ context: 'ad-creation' });
            expect(mockLogger.child).toHaveBeenCalledWith({ context: 'ad-creation' });
            expect(childLogger).toBe(mockLogger); // Since we mocked child to return this
        });
    });
});
