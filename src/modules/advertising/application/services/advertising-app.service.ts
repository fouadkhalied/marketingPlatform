import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { UploadPhoto } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { Ad, createAdSchema, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { FacebookPostInsights } from "../../../user/application/dtos/facebookDto/facebookInsights.dto";
import { FacebookPost } from "../../../user/application/dtos/facebookDto/facebookPost.dto";
import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { ApproveAdData } from "../dto/approveAdData";
import { autheticatedPage } from "../dto/authenticatedPage.dto";

export class AdvertisingAppService {
  constructor(
    private readonly advertisingRepository: IAdvertisingRepository,
    private readonly facebookService: FacebookPageService,
    private readonly photoUploader: UploadPhoto
  ) {

  }

  async createAd(
    object: any,
    userId: string
  ): Promise<ApiResponseInterface<{ AdId: string }>> {
    try {
      const adData = {
        ...object,
        userId: userId,
      };
  
      const validation = createAdSchema.safeParse(adData);
      if (!validation.success) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Validation error",
          validation.error.errors[0]
        );
      }
  
      const adId = await this.advertisingRepository.create(adData);
  
      return ResponseBuilder.success({ AdId: adId });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while creating ad",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  async uploadPhotoToAd(
    photo: Express.Multer.File[],
    adId: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      // upload file 
      const photoUploadResult = await this.photoUploader.execute(photo);

      console.log(photoUploadResult);
      
  
      // save photo URL in DB for the ad
      const updated = await this.advertisingRepository.addPhotoToAd(
        adId,
        photoUploadResult.url
      );
  
      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to ad"
        );
      }
  
      return ResponseBuilder.success({ photos: photoUploadResult.url.map((url,index) => ({url:url,index:index})) });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  async updatePhotoFromAd(
    photo: Express.Multer.File[],
    adId: string,
    userId: string,
    photoUrl: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      // upload file 
      const photoUploadResult = await this.photoUploader.execute(photo);

      console.log(photoUploadResult);
      
  
      // save photo URL in DB for the ad
      const updated = await this.advertisingRepository.updatePhotoFromAd(
        adId,
        userId,
        photoUploadResult.url[0],
        photoUrl
      );
  
      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to ad"
        );
      }
  
      return ResponseBuilder.success({ photos: photoUploadResult.url.map((url,index) => ({url:url,index:index})) });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deletePhotoFromAd(
    adId: string,
    userID: string,
    photoUrl: string
  ): Promise<ApiResponseInterface<boolean>> {
    try {

        const deletePhoto =await this.advertisingRepository.deletePhotoFromAd(adId,userID,photoUrl);

        if (deletePhoto) {
          return ResponseBuilder.success(true);
        }
  
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 
        "failed to delete photo of ad"
      );
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdById(id: string): Promise<ApiResponseInterface<Ad | null>> {
    try {
      const ad = await this.advertisingRepository.findById(id);

      if (!ad) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success(ad);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async listAdsForAdmin(
    status: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.advertisingRepository.findAllAdsForAdmin(status, pagination);
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for admin",
        error instanceof Error ? error.message : error
    );
    }
  }

  async listAdsForUser(
    status: string, // 👈 always string
    userId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.advertisingRepository.findAllAdsForUser(status, userId, pagination);
      return ResponseBuilder.paginatedSuccess(ads.data,ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }

  async listApprovedAdsForUser(
    pagination: PaginationParams,
    locations: string[],
    title?:string,
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.advertisingRepository.listApprovedAdsForUser(pagination, locations, title);
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for admin",
        error instanceof Error ? error.message : error
    );
    }
  }

  async getAdsByTitle(title: string, params: PaginationParams): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.advertisingRepository.findByTitle(title, params);
  
      if (!ads || ads.data.length === 0) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `No ads found with title: ${title}`
        );
      }
      
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ads by title",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  async updateAd(id: string, ad: Partial<Ad>): Promise<ApiResponseInterface<Ad | null>> {
    try {

      if (ad.targetCities && !Array.isArray(ad.targetCities)) {
        console.log('❌ Wrong type received:', typeof ad.targetCities, ad.targetCities);
        throw new Error(`Expected targetCities to be an array but got ${typeof ad.targetCities}`);
      }
      
      const updated = await this.advertisingRepository.update(id, ad);

      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success(updated);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while updating ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deleteAd(id: string): Promise<ApiResponseInterface<{ deleted: boolean }>> {
    try {
      const deleted = await this.advertisingRepository.delete(id);

      if (!deleted) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success({ deleted: true });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while deleting ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  
  
async approveAd(
  id: string, 
  socialMediaLinks?: ApproveAdData
): Promise<ApiResponseInterface<Ad>> {
  try {
    const approvedAd = await this.advertisingRepository.approveAd(
      id, 
      socialMediaLinks
    );

    return ResponseBuilder.success(approvedAd, "Ad approved successfully");
  } catch (error) {
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "Unexpected error while approving ad",
      error instanceof Error ? error.message : error
    );
  }
}

async activateAd(
  id: string,
  userId: string,
  role: string
): Promise<ApiResponseInterface<Ad>> {
  try {

    if (role === UserRole.ADMIN) {
      const activatedAd = await this.advertisingRepository.activateAd(id);
      return ResponseBuilder.success(activatedAd, "Ad activated successfully");
    } else {
      const activatedUserAd = await this.advertisingRepository.activateUserAd(id, userId);
      return ResponseBuilder.success(activatedUserAd, "Ad activated successfully");
    }
    
  } catch (error: any) {
    // If it's already an ErrorBuilder error, return it as-is
    if (error.code && error.message) {
      return error;
    }
    
    // Otherwise, wrap it in a generic error
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || "Failed to activate ad"
    );
  }
}

  async rejectAd(id: string, reason?: string): Promise<ApiResponseInterface<Ad>> {
    try {
      const rejectedAd = await this.advertisingRepository.rejectAd(id, reason);

      return ResponseBuilder.success(rejectedAd);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while rejecting ad",
        error instanceof Error ? error.message : error
      );
    }
  }
  // get all user autheticated pages (facebook , instagram , snapchat)
  async listPagesForUser(
    isActive: boolean,
    userId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<autheticatedPage[]>> {
    try {
      const pages = await this.advertisingRepository.getAllPagesForUser(isActive, userId, pagination);
      return ResponseBuilder.paginatedSuccess(pages.data, pages.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }


  async listPostsFromPageForUser(
    userId: string,
    pageId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<FacebookPost[]>> {
    try {

      const pageAccessToken = await this.advertisingRepository.getPageAccessTokenById(userId,pageId);
      if (!pageAccessToken) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR, "failed to retirve page access token for page id"
        )
      }

      const pages = await this.facebookService.getPagePosts(userId,pageId,pageAccessToken,{limit: pagination.limit});

      return ResponseBuilder.facebookPaginatedSuccess(pages.posts, pages.paging);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while retriving post from page",
        error instanceof Error ? error.message : error
      );
    }
  }


  async getPostInsights(
    userId: string,
    pageId: string,
    postIdOnPlatform: string
  ): Promise<ApiResponseInterface<FacebookPostInsights>> {
    try {
      // Get the page access token using the correct pageId
      const pageAccessToken = await this.advertisingRepository.getPageAccessTokenById(userId, pageId);
      if (!pageAccessToken) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR, 
          "Failed to retrieve page access token for page id"
        );
      }
      
  
      // Call the Facebook service with correct parameters
      const insights = await this.facebookService.getPostInsights(
        userId,           // userId for logging
        postIdOnPlatform, // post id
        pageAccessToken   // The page access token
      );
  
      return ResponseBuilder.success(insights);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while retrieving post insights",
        error instanceof Error ? error.message : error
      );
    }
  }

  async assignCreditToAd(
    userId: string,
    adId: string,
    credit: number
  ): Promise<ApiResponseInterface<{ success: boolean; adId: string; credit: number }>> {
    try {
      // 1. Check if user has enough balance
      const hasBalance = await this.advertisingRepository.hasSufficientBalance(userId, credit);
      if (!hasBalance) {
        return ErrorBuilder.build(
          ErrorCode.INSUFFICIENT_BALANCE,
          `User ${userId} does not have enough balance to assign ${credit} credits`
        );
      }
  
      // 2. Run transaction (repo handles atomicity)
      const result = await this.advertisingRepository.assignCreditToAd(userId, adId, credit);
  
      if (!result) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to assign credit to ad"
        );
      }
  
      return ResponseBuilder.success({
        success: true,
        adId,
        credit,
      });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while assigning credit to ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Add to UserAppService class
async deactivateUserAd(
  userId: string,
  adId: string,
  role: string
): Promise<ApiResponseInterface<Ad>> {
  try {

    let deactivatedAd;

    if(role === UserRole.USER)
     deactivatedAd = await this.advertisingRepository.deactivateUserAd(userId, adId);
   else 
    deactivatedAd = await this.advertisingRepository.deactivateUserAdByAdmin(userId, adId)
    
    return ResponseBuilder.success(deactivatedAd, "Ad deactivated successfully");
  } catch (error: any) {
    if (error.code && error.message) {
      return error;
    }
    
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || "Failed to deactivate ad"
    );
  }
}

async promoteAd(
  userId: string,
  adId: string
): Promise<ApiResponseInterface<Ad>> {
  try {
    const promoteAd = await this.advertisingRepository.promoteAd(adId,userId)
    return ResponseBuilder.success(promoteAd, "Ad promoted successfully");
  } catch (error: any) {
    if (error.code && error.message) {
      return error;
    }
    
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || "Failed to deactivate ad"
    );
  }
}

}