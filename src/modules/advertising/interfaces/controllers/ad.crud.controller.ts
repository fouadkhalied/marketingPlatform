import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdCrudAppService } from "../../application/services/ad.crud-app.service";

export class AdCrudController {
  constructor(private readonly adCrudService: AdCrudAppService) {}

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

  // ✅ Create Ad
  async createAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const result = await this.adCrudService.createAd(req.body, req.user.id)

      const statusCode = this.getStatusCode(result);
      const responseStatusCode = result.success ? 201 : statusCode;

      res.status(responseStatusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ad", message: error.message });
    }
  }

  // ✅ Get Ad by ID
  async getAd(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.adCrudService.getAdById(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch ad", message: error.message });
    }
  }

  // ✅ Get Ads by Title (En or Ar)
  async getAdsByTitle(req: Request, res: Response): Promise<void> {
    try {
      const { page , limit , title } = req.query;

      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };

      if (!title) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Title parameter is required"
        );
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.adCrudService.getAdsByTitle(title.toString(), pagination);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500)
        .json({ error: "Failed to fetch ads by title", message: error.message });
    }
  }

  // ✅ Update Ad
  async updateAd(req: Request, res: Response): Promise<void> {
    try {

      if (req.body.targetCities) {
        if (Array.isArray(req.body.targetCities)) {
          // already fine
        } else if (typeof req.body.targetCities === "object") {
          // converts { "0": "riyadh" } → ["riyadh"]
          req.body.targetCities = Object.values(req.body.targetCities);
        } else if (typeof req.body.targetCities === "string") {
          // converts '["riyadh"]' → ["riyadh"]
          try {
            req.body.targetCities = JSON.parse(req.body.targetCities);
          } catch {
            req.body.targetCities = [req.body.targetCities];
          }
        } else {
          throw new Error(`Unexpected type for targetCities: ${typeof req.body.targetCities}`);
        }
      }
      const result = await this.adCrudService.updateAd(
        req.params.id,
        req.body
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update ad", message: error.message });
    }
  }

  // ✅ Delete Ad
  async deleteAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.params.id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "id must be sent"
        );
        res.status(403).json(errorResponse);
        return;
      }

      if (!req.user?.id || !req.user?.role) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED_ACCESS,
          "please login"
        );
        res.status(403).json(errorResponse);
        return;
      }

      const result = await this.adCrudService.deleteAd(req.params.id, req.user.id, req.user.role);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete ad", message: error.message });
    }
  }
}
