import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { FacebookPageRepositoryImpl } from "../../../user/infrastructure/repositories/facebook.repository.impl";
import { UploadPhoto, BucketType } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { SupabaseUploader } from "../../../../infrastructure/shared/common/supabase/module/supabaseUploader.module";
import { createLogger, ILogger } from "../../../../infrastructure/shared/common/logging";

// Repositories
import { AdsPackageRepository } from "../../infrastructure/repositories/ads.package.repository";
import { AdCrudRepository } from "../../infrastructure/repositories/ad.crud.repository";
import { AdPhotoRepository } from "../../infrastructure/repositories/ad.photo.repository";
import { AdListingRepository } from "../../infrastructure/repositories/ad.listing.repository";
import { AdStatusRepository } from "../../infrastructure/repositories/ad.status.repository";
import { AdPromotionRepository } from "../../infrastructure/repositories/ad.promotion.repository";
import { SocialMediaPageRepository } from "../../infrastructure/repositories/social.media.page.repository";
import { PixelRepository } from "../../infrastructure/repositories/pixel.repository";

// Services
import { AdsPackageAppService } from "../../application/services/ads.package-app.service";
import { AdCrudAppService } from "../../application/services/ad.crud-app.service";
import { AdPhotoAppService } from "../../application/services/ad.photo-app.service";
import { AdListingAppService } from "../../application/services/ad.listing-app.service";
import { AdStatusAppService } from "../../application/services/ad.status-app.service";
import { AdPromotionAppService } from "../../application/services/ad.promotion-app.service";
import { SocialMediaAppService } from "../../application/services/social.media-app.service";
import { PixelAppService } from "../../application/services/pixel-app.service";

// Controllers
import { AdsPackageController } from "../controllers/ads.package.controller";
import { AdCrudController } from "../controllers/ad.crud.controller";
import { AdPhotoController } from "../controllers/ad.photo.controller";
import { AdListingController } from "../controllers/ad.listing.controller";
import { AdStatusController } from "../controllers/ad.status.controller";
import { AdPromotionController } from "../controllers/ad.promotion.controller";
import { SocialMediaController } from "../controllers/social.media.controller";
import { PixelController } from "../controllers/pixel.controller";
import { createDefaultNotificationService } from "../../../../infrastructure/shared/notification/factories/notification.factory";

// Factory functions for shared dependencies
function createSharedDependencies() {
    const logger = createLogger('advertising');
    const facebookRepo = new FacebookPageRepositoryImpl();
    const facebookService = new FacebookPageService(facebookRepo);

    const supabaseUploader = new SupabaseUploader(BucketType.AD);
    const photoUploader = new UploadPhoto(supabaseUploader, BucketType.AD);

    return { logger, facebookService, photoUploader };
}

// Repository factories
function createAdCrudRepository(): AdCrudRepository {
    return new AdCrudRepository();
}

function createAdPhotoRepository(): AdPhotoRepository {
    return new AdPhotoRepository();
}

function createAdListingRepository(): AdListingRepository {
    return new AdListingRepository();
}

function createAdStatusRepository(): AdStatusRepository {
    return new AdStatusRepository();
}

function createAdPromotionRepository(): AdPromotionRepository {
    return new AdPromotionRepository();
}

function createSocialMediaPageRepository(): SocialMediaPageRepository {
    return new SocialMediaPageRepository();
}

function createPixelRepository(): PixelRepository {
    return new PixelRepository();
}

function createAdsPackageRepository(): AdsPackageRepository {
    return new AdsPackageRepository();
}

// Service factories
function createAdCrudAppService(logger: ILogger): AdCrudAppService {
    const adCrudRepository = createAdCrudRepository();
    return new AdCrudAppService(adCrudRepository, logger);
}

function createAdPhotoAppService(logger: ILogger): AdPhotoAppService {
    const adPhotoRepository = createAdPhotoRepository();
    const { photoUploader } = createSharedDependencies();
    return new AdPhotoAppService(adPhotoRepository, photoUploader, logger);
}

function createAdListingAppService(logger: ILogger): AdListingAppService {
    const adListingRepository = createAdListingRepository();
    return new AdListingAppService(adListingRepository, logger);
}

function createAdStatusAppService(logger: ILogger): AdStatusAppService {
    const adStatusRepository = createAdStatusRepository();
    const { notificationService } = createDefaultNotificationService();
    return new AdStatusAppService(adStatusRepository, logger, notificationService);
}

function createAdPromotionAppService(logger: ILogger): AdPromotionAppService {
    const adPromotionRepository = createAdPromotionRepository();
    return new AdPromotionAppService(adPromotionRepository, logger);
}

function createSocialMediaAppService(logger: ILogger): SocialMediaAppService {
    const socialMediaPageRepository = createSocialMediaPageRepository();
    const { facebookService } = createSharedDependencies();
    return new SocialMediaAppService(socialMediaPageRepository, facebookService, logger);
}

function createPixelAppService(logger: ILogger): PixelAppService {
    const pixelRepository = createPixelRepository();
    return new PixelAppService(pixelRepository, logger);
}

function createAdsPackageAppService(logger: ILogger): AdsPackageAppService {
    const adsPackageRepository = createAdsPackageRepository();
    return new AdsPackageAppService(adsPackageRepository, logger);
}

// Controller factories
function createAdCrudController(logger: ILogger): AdCrudController {
    const adCrudService = createAdCrudAppService(logger);
    return new AdCrudController(adCrudService, logger);
}

function createAdPhotoController(logger: ILogger): AdPhotoController {
    const adPhotoService = createAdPhotoAppService(logger);
    return new AdPhotoController(adPhotoService, logger);
}

function createAdListingController(logger: ILogger): AdListingController {
    const adListingService = createAdListingAppService(logger);
    return new AdListingController(adListingService, logger);
}

function createAdStatusController(logger: ILogger): AdStatusController {
    const adStatusService = createAdStatusAppService(logger);
    return new AdStatusController(adStatusService, logger);
}

function createAdPromotionController(logger: ILogger): AdPromotionController {
    const adPromotionService = createAdPromotionAppService(logger);
    return new AdPromotionController(adPromotionService, logger);
}

function createSocialMediaController(logger: ILogger): SocialMediaController {
    const socialMediaService = createSocialMediaAppService(logger);
    return new SocialMediaController(socialMediaService, logger);
}

function createPixelController(logger: ILogger): PixelController {
    const pixelService = createPixelAppService(logger);
    return new PixelController(pixelService, logger);
}

function createAdsPackageController(logger: ILogger): AdsPackageController {
    const adsPackageService = createAdsPackageAppService(logger);
    return new AdsPackageController(adsPackageService, logger);
}

// Composite factory for all controllers
export function createAllAdvertisingControllers() {
    const { logger } = createSharedDependencies();

    return {
        adCrud: createAdCrudController(logger),
        adPhoto: createAdPhotoController(logger),
        adListing: createAdListingController(logger),
        adStatus: createAdStatusController(logger),
        adPromotion: createAdPromotionController(logger),
        socialMedia: createSocialMediaController(logger),
        pixel: createPixelController(logger),
        adsPackage: createAdsPackageController(logger),
    };
}

// // Legacy factory for backward compatibility
// export function createAdvertisingController() {

//     const { facebookService, photoUploader } = createSharedDependencies();

//     // Create all repositories
//     const repositories = {
//         adCrud: createAdCrudRepository(),
//         adPhoto: createAdPhotoRepository(),
//         adListing: createAdListingRepository(),
//         adStatus: createAdStatusRepository(),
//         adPromotion: createAdPromotionRepository(),
//         socialMedia: createSocialMediaPageRepository(),
//         pixel: createPixelRepository(),
//     };

//     // Create services
//     const services = {
//         adCrud: new AdCrudAppService(repositories.adCrud),
//         adPhoto: new AdPhotoAppService(repositories.adPhoto, photoUploader),
//         adListing: new AdListingAppService(repositories.adListing),
//         adStatus: new AdStatusAppService(repositories.adStatus),
//         adPromotion: new AdPromotionAppService(repositories.adPromotion),
//         socialMedia: new SocialMediaAppService(repositories.socialMedia, facebookService),
//         pixel: new PixelAppService(repositories.pixel),
//     };

//     // Create controllers
//     const controllers = {
//         adCrud: new AdCrudController(services.adCrud),
//         adPhoto: new AdPhotoController(services.adPhoto),
//         adListing: new AdListingController(services.adListing),
//         adStatus: new AdStatusController(services.adStatus),
//         adPromotion: new AdPromotionController(services.adPromotion),
//         socialMedia: new SocialMediaController(services.socialMedia),
//         pixel: new PixelController(services.pixel),
//     };

//     return controllers;
// }
