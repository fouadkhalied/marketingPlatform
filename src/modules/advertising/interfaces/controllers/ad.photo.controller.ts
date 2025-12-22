import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdPhotoAppService } from "../../application/services/ad.photo-app.service";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdPhotoController {
  constructor(
    private readonly adPhotoService: AdPhotoAppService,
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

  async uploadPhotoToAd(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
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
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Ad ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      // call service
      const response = await this.adPhotoService.uploadPhotoToAd(files, id);

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

  async updatePhotoFromAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
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
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Ad ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      const photoUrl = req.query.photoUrl as string;
      if (!photoUrl) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "photoUrl to update is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      // call service
      const response = await this.adPhotoService.updatePhotoFromAd(files,id,req.user.id,photoUrl,req.user.role);

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

  async deletePhotoFromAd(req: Request, res: Response): Promise<void> {
    try {

      if (!req.user?.id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const id = req.params.id; // make sure your route has :id
      if (!id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Ad ID is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      const photoUrl = req.query.photoUrl as string;
      console.log(photoUrl);

      if (!photoUrl) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "photoUrl to delete is required"
        );
        res
          .status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD])
          .json(errorResponse);
        return;
      }

      // call service
      const response = await this.adPhotoService.deletePhotoFromAd(id, req.user.id, photoUrl);

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
