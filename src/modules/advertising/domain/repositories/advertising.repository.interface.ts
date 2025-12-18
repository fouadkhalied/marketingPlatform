import { IAdCrudRepository } from "./ad.crud.repository.interface";
import { IAdPhotoRepository } from "./ad.photo.repository.interface";
import { IAdListingRepository } from "./ad.listing.repository.interface";
import { IAdStatusRepository } from "./ad.status.repository.interface";
import { IAdPromotionRepository } from "./ad.promotion.repository.interface";
import { ISocialMediaPageRepository } from "./social.media.page.repository.interface";
import { IPixelRepository } from "./pixel.repository.interface";

// ============================================
// Combined Interface (for backward compatibility)
// ============================================

export interface IAdvertisingRepository
  extends IAdCrudRepository,
    IAdPhotoRepository,
    IAdListingRepository,
    IAdStatusRepository,
    IAdPromotionRepository,
    ISocialMediaPageRepository,
    IPixelRepository {}
