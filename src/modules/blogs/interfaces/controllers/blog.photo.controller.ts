import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { BlogPhotoAppService } from "../../application/services/blog.photo-app.service";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class BlogPhotoController {
  constructor(
    private readonly blogPhotoService: BlogPhotoAppService,
    private readonly logger: ILogger
  ) {}

  // ✅ Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }
    if (
      response.error?.code &&
      ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]
    ) {
      return ERROR_STATUS_MAP[
        response.error.code as keyof typeof ERROR_STATUS_MAP
      ];
    }
    return 500; // default to internal server error
  }

  async uploadPhotoToBlog(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Blog photo upload request', {
        blogId: req.params.id,
        fileCount: (req.files as Express.Multer.File[])?.length || 0,
        fileNames: (req.files as Express.Multer.File[])?.map(f => f.originalname) || []
      });

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        this.logger.warn('Blog photo upload: No files uploaded', { blogId: req.params.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "No files uploaded"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      const id = req.params.id; // make sure your route has :id

      if (!id) {
        this.logger.warn('Blog photo upload: Blog ID missing');
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Blog ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      this.logger.info('Blog photo upload: Calling service', {
        blogId: id,
        fileCount: files.length,
        fileNames: files.map(f => f.originalname)
      });

      // call service
      const response = await this.blogPhotoService.uploadPhotoToBlog(files, id);

      this.logger.info('Blog photo upload: Service response', {
        blogId: id,
        success: response.success,
        hasError: !!response.error,
        uploadedUrls: response.success ? (response.data as any)?.photos?.length || 0 : 0
      });

      res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
      res
        .status(ERROR_STATUS_MAP[ErrorCode.INTERNAL_SERVER_ERROR])
        .json(errorResponse);
    }
  }

  async updatePhotoFromBlog(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Blog photo update request', {
        blogId: req.params.id,
        userId: req.user?.id,
        userRole: req.user?.role,
        fileCount: (req.files as Express.Multer.File[])?.length || 0,
        oldPhotoUrl: req.query.photoUrl
      });

      if (!req.user?.id || !req.user?.role) {
        this.logger.warn('Blog photo update: User not authenticated', { blogId: req.params.id });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        this.logger.warn('Blog photo update: No files uploaded', { blogId: req.params.id, userId: req.user.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "No files uploaded"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      if (files.length !== 1) {
        this.logger.warn('Blog photo update: Multiple files uploaded', {
          blogId: req.params.id,
          userId: req.user.id,
          fileCount: files.length
        });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "One file must be uploaded only"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.VALIDATION_ERROR])
          .json(errorResponse);
        return;
      }

      const id = req.params.id; // make sure your route has :id

      if (!id) {
        this.logger.warn('Blog photo update: Blog ID missing', { userId: req.user.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Blog ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      const photoUrl = req.query.photoUrl as string;
      if (!photoUrl) {
        this.logger.warn('Blog photo update: Old photo URL missing', { blogId: id, userId: req.user.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "photoUrl to update is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      this.logger.info('Blog photo update: Calling service', {
        blogId: id,
        userId: req.user.id,
        oldPhotoUrl: photoUrl,
        newFileName: files[0].originalname
      });

      // call service
      const response = await this.blogPhotoService.updatePhotoFromBlog(files,id,req.user.id,photoUrl,req.user.role);

      this.logger.info('Blog photo update: Service response', {
        blogId: id,
        userId: req.user.id,
        success: response.success,
        hasError: !!response.error
      });

      res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
      res
        .status(ERROR_STATUS_MAP[ErrorCode.INTERNAL_SERVER_ERROR])
        .json(errorResponse);
    }
  }

  async deletePhotoFromBlog(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Blog photo delete request', {
        blogId: req.params.id,
        userId: req.user?.id,
        photoUrl: req.query.photoUrl
      });

      if (!req.user?.id) {
        this.logger.warn('Blog photo delete: User not authenticated', { blogId: req.params.id });
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const id = req.params.id; // make sure your route has :id
      if (!id) {
        this.logger.warn('Blog photo delete: Blog ID missing', { userId: req.user.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Blog ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      const photoUrl = req.query.photoUrl as string;

      if (!photoUrl) {
        this.logger.warn('Blog photo delete: Photo URL missing', { blogId: id, userId: req.user.id });
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "photoUrl to delete is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      this.logger.info('Blog photo delete: Calling service', {
        blogId: id,
        userId: req.user.id,
        photoUrl
      });

      // call service
      const response = await this.blogPhotoService.deletePhotoFromBlog(id, req.user.id, photoUrl);

      this.logger.info('Blog photo delete: Service response', {
        blogId: id,
        userId: req.user.id,
        success: response.success,
        hasError: !!response.error
      });

      res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while uploading photo",
        error instanceof Error ? error.message : error
      );
      res
        .status(ERROR_STATUS_MAP[ErrorCode.INTERNAL_SERVER_ERROR])
        .json(errorResponse);
    }
  }
}
