import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { UploadPhoto } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { IAdPhotoRepository } from "../../domain/repositories/ad.photo.repository.interface";

export class AdPhotoAppService {
  constructor(
    private readonly adPhotoRepository: IAdPhotoRepository,
    private readonly photoUploader: UploadPhoto
  ) {}

  async uploadPhotoToAd(
    photo: Express.Multer.File[],
    adId: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      // upload file
      const photoUploadResult = await this.photoUploader.execute(photo);

      // save photo URL in DB for the ad
      const updated = await this.adPhotoRepository.addPhotoToAd(
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
    photoUrl: string,
    role: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      // upload file
      await this.photoUploader.deletePhoto(photoUrl)
      const photoUploadResult = await this.photoUploader.execute(photo);


      // save photo URL in DB for the ad
      const updated = await this.adPhotoRepository.updatePhotoFromAd(
        adId,
        userId,
        photoUploadResult.url[0],
        photoUrl,
        role
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

       await this.photoUploader.deletePhoto(photoUrl);

       const deletePhoto =await this.adPhotoRepository.deletePhotoFromAd(adId,userID,photoUrl);

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
}
