import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { UploadPhoto } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { IBlogPhotoRepository } from "../../domain/repositories/blog.photo.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class BlogPhotoAppService {
  constructor(
    private readonly blogPhotoRepository: IBlogPhotoRepository,
    private readonly photoUploader: UploadPhoto,
    private readonly logger: ILogger
  ) {}

  async uploadPhotoToBlog(
    photo: Express.Multer.File[],
    blogId: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      this.logger.info('Blog photo upload service: Starting upload process', {
        blogId,
        photoCount: photo.length,
        fileNames: photo.map(p => p.originalname),
        fileSizes: photo.map(p => p.size)
      });

      // Upload photo to storage
      this.logger.debug('Blog photo upload service: Uploading to storage', { blogId });
      const photoUploadResult = await this.photoUploader.execute(photo);

      this.logger.debug('Blog photo upload service: Photo uploaded to storage', {
        blogId,
        uploadedUrls: photoUploadResult.url.length,
        urls: photoUploadResult.url
      });

      // Save photo URL in database for the blog
      this.logger.debug('Blog photo upload service: Saving to database', {
        blogId,
        photoUrls: photoUploadResult.url
      });

      const updated = await this.blogPhotoRepository.addPhotoToBlog(
        blogId,
        photoUploadResult.url
      );

      if (!updated) {
        this.logger.error('Blog photo upload service: Failed to save photo to database', {
          blogId,
          photoUrls: photoUploadResult.url
        });
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to blog"
        );
      }

      this.logger.info('Blog photo upload service: Successfully uploaded and attached photo to blog', {
        blogId,
        uploadedUrls: photoUploadResult.url.length,
        featuredImageUrl: photoUploadResult.url[0]
      });

      return ResponseBuilder.success({ photos: photoUploadResult.url.map((url,index) => ({url:url,index:index})) });
    } catch (error) {
      this.logger.error('Blog photo upload service: Unexpected error during photo upload', {
        blogId,
        photoCount: photo.length,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updatePhotoFromBlog(
    photo: Express.Multer.File[],
    blogId: string,
    userId: string,
    photoUrl: string,
    role: string
  ): Promise<ApiResponseInterface<{ photos: { url: string; index: number }[] }>> {
    try {
      this.logger.info('Blog photo update service: Starting update process', {
        blogId,
        userId,
        role,
        oldPhotoUrl: photoUrl,
        newFileName: photo[0]?.originalname,
        fileSize: photo[0]?.size
      });

      // Delete old photo from storage
      this.logger.debug('Blog photo update service: Deleting old photo', { blogId, photoUrl });
      await this.photoUploader.deletePhoto(photoUrl);

      // Upload new photo
      this.logger.debug('Blog photo update service: Uploading new photo', { blogId, fileName: photo[0]?.originalname });
      const photoUploadResult = await this.photoUploader.execute(photo);

      this.logger.debug('Blog photo update service: Photo uploaded to storage', {
        blogId,
        uploadedUrls: photoUploadResult.url.length,
        newUrl: photoUploadResult.url[0]
      });

      // Update photo URL in database
      this.logger.debug('Blog photo update service: Updating database', {
        blogId,
        userId,
        oldPhotoUrl: photoUrl,
        newPhotoUrl: photoUploadResult.url[0],
        role
      });

      const updated = await this.blogPhotoRepository.updatePhotoFromBlog(
        blogId,
        userId,
        photoUploadResult.url[0],
        photoUrl,
        role
      );

      if (!updated) {
        this.logger.error('Blog photo update service: Failed to update photo in database', {
          blogId,
          userId,
          oldPhotoUrl: photoUrl,
          newPhotoUrl: photoUploadResult.url[0]
        });
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to blog"
        );
      }

      this.logger.info('Blog photo update service: Successfully updated blog photo', {
        blogId,
        userId,
        oldPhotoUrl: photoUrl,
        newPhotoUrl: photoUploadResult.url[0]
      });

      return ResponseBuilder.success({ photos: photoUploadResult.url.map((url,index) => ({url:url,index:index})) });
    } catch (error) {
      this.logger.error('Blog photo update service: Unexpected error during photo update', {
        blogId,
        userId,
        oldPhotoUrl: photoUrl,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deletePhotoFromBlog(
    blogId: string,
    userID: string,
    photoUrl: string
  ): Promise<ApiResponseInterface<boolean>> {
    try {
      this.logger.info('Blog photo delete service: Starting delete process', {
        blogId,
        userId: userID,
        photoUrl
      });

      // Delete photo from storage
      this.logger.debug('Blog photo delete service: Deleting from storage', {
        blogId,
        photoUrl
      });

      await this.photoUploader.deletePhoto(photoUrl);

      this.logger.debug('Blog photo delete service: Photo deleted from storage', {
        blogId,
        photoUrl
      });

      // Delete photo URL from database
      this.logger.debug('Blog photo delete service: Deleting from database', {
        blogId,
        userId: userID,
        photoUrl
      });

      const deletePhoto = await this.blogPhotoRepository.deletePhotoFromBlog(blogId, userID, photoUrl);

      if (deletePhoto) {
        this.logger.info('Blog photo delete service: Successfully deleted photo from blog', {
          blogId,
          userId: userID,
          photoUrl
        });
        return ResponseBuilder.success(true);
      }

      this.logger.warn('Blog photo delete service: Blog or photo not found', {
        blogId,
        userId: userID,
        photoUrl
      });

      return ErrorBuilder.build(ErrorCode.RESOURCE_NOT_FOUND,
        "Blog or photo not found"
      );
    } catch (error) {
      this.logger.error('Blog photo delete service: Unexpected error during photo deletion', {
        blogId,
        userId: userID,
        photoUrl,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while deleting photo",
        error instanceof Error ? error.message : error
      );
    }
  }
}
