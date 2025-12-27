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
      this.logger.info('Uploading photo to blog', {
        blogId,
        photoCount: photo.length,
        fileNames: photo.map(p => p.originalname)
      });

      // upload file
      const photoUploadResult = await this.photoUploader.execute(photo);
      this.logger.debug('Photo upload to storage completed', {
        blogId,
        uploadedUrls: photoUploadResult.url.length
      });

      // save photo URL in DB for the blog
      const updated = await this.blogPhotoRepository.addPhotoToBlog(
        blogId,
        photoUploadResult.url
      );

      if (!updated) {
        this.logger.error('Failed to save photo URLs to database', { blogId });
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to blog"
        );
      }

      this.logger.info('Photo uploaded and attached to blog successfully', { blogId });
      return ResponseBuilder.success({ photos: photoUploadResult.url.map((url,index) => ({url:url,index:index})) });
    } catch (error) {
      this.logger.error('Failed to upload photo to blog', {
        blogId,
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
      // upload file
      await this.photoUploader.deletePhoto(photoUrl)
      const photoUploadResult = await this.photoUploader.execute(photo);


      // save photo URL in DB for the blog
      const updated = await this.blogPhotoRepository.updatePhotoFromBlog(
        blogId,
        userId,
        photoUploadResult.url[0],
        photoUrl,
        role
      );

      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to attach photo to blog"
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

  async deletePhotoFromBlog(
    blogId: string,
    userID: string,
    photoUrl: string
  ): Promise<ApiResponseInterface<boolean>> {
    try {

       await this.photoUploader.deletePhoto(photoUrl);

       const deletePhoto =await this.blogPhotoRepository.deletePhotoFromBlog(blogId,userID,photoUrl);

        if (deletePhoto) {
          return ResponseBuilder.success(true);
        }

      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR,
        "failed to delete photo of blog"
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
