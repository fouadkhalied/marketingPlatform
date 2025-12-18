import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { FacebookPageRepositoryImpl } from "../../../user/infrastructure/repositories/facebook.repository.impl";
import { UploadPhoto } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { SupabaseUploader } from "../../../../infrastructure/shared/common/supabase/module/supabaseUploader.module";

// Repositories
import { AdCrudRepository } from "../../infrastructure/repositories/ad.crud.repository";
import { AdPhotoRepository } from "../../infrastructure/repositories/ad.photo.repository";
import { AdListingRepository } from "../../infrastructure/repositories/ad.listing.repository";
import { AdStatusRepository } from "../../infrastructure/repositories/ad.status.repository";
import { AdPromotionRepository } from "../../infrastructure/repositories/ad.promotion.repository";
import { SocialMediaPageRepository } from "../../infrastructure/repositories/social.media.page.repository";
import { PixelRepository } from "../../infrastructure/repositories/pixel.repository";

// Services
import { AdCrudAppService } from "../../application/services/ad.crud-app.service";
import { AdPhotoAppService } from "../../application/services/ad.photo-app.service";
import { AdListingAppService } from "../../application/services/ad.listing-app.service";
import { AdStatusAppService } from "../../application/services/ad.status-app.service";
import { AdPromotionAppService } from "../../application/services/ad.promotion-app.service";
import { SocialMediaAppService } from "../../application/services/social.media-app.service";
import { PixelAppService } from "../../application/services/pixel-app.service";

// Controllers
import { AdCrudController } from "../controllers/ad.crud.controller";
import { AdPhotoController } from "../controllers/ad.photo.controller";
import { AdListingController } from "../controllers/ad.listing.controller";
import { AdStatusController } from "../controllers/ad.status.controller";
import { AdPromotionController } from "../controllers/ad.promotion.controller";
import { SocialMediaController } from "../controllers/social.media.controller";
import { PixelController } from "../controllers/pixel.controller";

// Factory functions for shared dependencies
function createSharedDependencies() {
    const facebookRepo = new FacebookPageRepositoryImpl();
    const facebookService = new FacebookPageService(facebookRepo);

    const supabaseUploader = new SupabaseUploader();
    const photoUploader = new UploadPhoto(supabaseUploader);

    return { facebookService, photoUploader };
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

// Service factories
function createAdCrudAppService(): AdCrudAppService {
    const adCrudRepository = createAdCrudRepository();
    return new AdCrudAppService(adCrudRepository);
}

function createAdPhotoAppService(): AdPhotoAppService {
    const adPhotoRepository = createAdPhotoRepository();
    const { photoUploader } = createSharedDependencies();
    return new AdPhotoAppService(adPhotoRepository, photoUploader);
}

function createAdListingAppService(): AdListingAppService {
    const adListingRepository = createAdListingRepository();
    return new AdListingAppService(adListingRepository);
}

function createAdStatusAppService(): AdStatusAppService {
    const adStatusRepository = createAdStatusRepository();
    return new AdStatusAppService(adStatusRepository);
}

function createAdPromotionAppService(): AdPromotionAppService {
    const adPromotionRepository = createAdPromotionRepository();
    return new AdPromotionAppService(adPromotionRepository);
}

function createSocialMediaAppService(): SocialMediaAppService {
    const socialMediaPageRepository = createSocialMediaPageRepository();
    const { facebookService } = createSharedDependencies();
    return new SocialMediaAppService(socialMediaPageRepository, facebookService);
}

function createPixelAppService(): PixelAppService {
    const pixelRepository = createPixelRepository();
    return new PixelAppService(pixelRepository);
}

// Controller factories
function createAdCrudController(): AdCrudController {
    const adCrudService = createAdCrudAppService();
    return new AdCrudController(adCrudService);
}

function createAdPhotoController(): AdPhotoController {
    const adPhotoService = createAdPhotoAppService();
    return new AdPhotoController(adPhotoService);
}

function createAdListingController(): AdListingController {
    const adListingService = createAdListingAppService();
    return new AdListingController(adListingService);
}

function createAdStatusController(): AdStatusController {
    const adStatusService = createAdStatusAppService();
    return new AdStatusController(adStatusService);
}

function createAdPromotionController(): AdPromotionController {
    const adPromotionService = createAdPromotionAppService();
    return new AdPromotionController(adPromotionService);
}

function createSocialMediaController(): SocialMediaController {
    const socialMediaService = createSocialMediaAppService();
    return new SocialMediaController(socialMediaService);
}

function createPixelController(): PixelController {
    const pixelService = createPixelAppService();
    return new PixelController(pixelService);
}

// Composite factory for all controllers
export function createAllAdvertisingControllers() {
    return {
        adCrud: createAdCrudController(),
        adPhoto: createAdPhotoController(),
        adListing: createAdListingController(),
        adStatus: createAdStatusController(),
        adPromotion: createAdPromotionController(),
        socialMedia: createSocialMediaController(),
        pixel: createPixelController(),
    };
}

// Legacy factory for backward compatibility
export function createAdvertisingController() {

    const { facebookService, photoUploader } = createSharedDependencies();

    // Create all repositories
    const repositories = {
        adCrud: createAdCrudRepository(),
        adPhoto: createAdPhotoRepository(),
        adListing: createAdListingRepository(),
        adStatus: createAdStatusRepository(),
        adPromotion: createAdPromotionRepository(),
        socialMedia: createSocialMediaPageRepository(),
        pixel: createPixelRepository(),
    };

    // Create services
    const services = {
        adCrud: new AdCrudAppService(repositories.adCrud),
        adPhoto: new AdPhotoAppService(repositories.adPhoto, photoUploader),
        adListing: new AdListingAppService(repositories.adListing),
        adStatus: new AdStatusAppService(repositories.adStatus),
        adPromotion: new AdPromotionAppService(repositories.adPromotion),
        socialMedia: new SocialMediaAppService(repositories.socialMedia, facebookService),
        pixel: new PixelAppService(repositories.pixel),
    };

    // Create controllers
    const controllers = {
        adCrud: new AdCrudController(services.adCrud),
        adPhoto: new AdPhotoController(services.adPhoto),
        adListing: new AdListingController(services.adListing),
        adStatus: new AdStatusController(services.adStatus),
        adPromotion: new AdPromotionController(services.adPromotion),
        socialMedia: new SocialMediaController(services.socialMedia),
        pixel: new PixelController(services.pixel),
    };

    return controllers;
}
