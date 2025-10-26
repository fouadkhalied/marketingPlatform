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
    files: Express.Multer.File[]
  ): Promise<PhotoUploadResult> {
    try {
      // prepare photo object (VO validation etc.)
      const photos: PhotosInterface[] = new Photo(files).prepareForUpload();

      // upload the single photo
      const uploadedPhotos = await Promise.all(photos.map(async (photo) => {
        const uploaded = await this.uploader.upload(photo);
        return {
          fileName: photo.fileName,
          url: uploaded ? await this.uploader.getUrl(photo.fileName) : null
        };
      }));

      // get photo URL
      Promise.all(uploadedPhotos.map(async (photo) => {
        const photoUrl = await this.uploader.getUrl(photo.fileName);
        return photoUrl;
      }));
      return {
        success: true,
        message: "ad photo uploaded successfully",
        url: uploadedPhotos.map((photo) => photo.url!).filter((url): url is string => url !== null)
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
