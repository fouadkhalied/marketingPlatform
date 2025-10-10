import { PhotosInterface } from "../interfaces/photo.interface";
import { IUploader } from "../interfaces/photoUploader.interface";
import { PhotoUploadResult } from "../interfaces/photoUploadResult.interface";
import { Photo } from "../valueObject/photo.vo";

export class UploadPhoto {
  constructor(
    private readonly uploader: IUploader
  ) {
    
  }

  async execute(
    file: Express.Multer.File // ✅ single file instead of array
  ): Promise<PhotoUploadResult> {
    try {
      // prepare photo object (VO validation etc.)
      const photo: PhotosInterface = new Photo([file]).prepareForUpload();

      // upload the single photo
      await this.uploader.upload(photo);

      // get photo URL
      const photoUrl: string = await this.uploader.getUrl(photo.fileName);

      return {
        success: true,
        message: "ad photo uploaded successfully",
        url: photoUrl
      };
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

//   private async save(propertyId: number, coverUrl: string, photosUrl: string[]): Promise<void> {
//     await this.repo.savePropertyCoverPhoto(propertyId, coverUrl);
//     await this.repo.savePropertyPhotos(propertyId, photosUrl);
//   }

//   async validate(propertyId: number, userId: number): Promise<boolean> {
//     return this.repo.findPropertyIDandUserID(propertyId, userId);
//   }
}
