import { Request, Response } from "express";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdStatus } from "../../domain/enums/ads.status.enum";

export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingAppService) {}

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

   private isAdStatus(value: any): value is AdStatus {
    return ["pending", "approved", "rejected"].includes(value);
  }

  // ✅ Create Ad
  async createAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const result = await this.advertisingService.createAd(req.body, req.user.id)

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
      const result = await this.advertisingService.getAdById(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch ad", message: error.message });
    }
  }

  // ✅ List Ads
  async listAds(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }
  
      const { limit, page, status } = req.query;
  
      // ✅ Normalize status into a string
      const normalizedStatus = typeof status === "string" && status.trim() !== ""
        ? status.trim()
        : "all"; // 👈 always a string now
  
      // ✅ Validate only if it’s not "all"
      if (normalizedStatus !== "all" && !this.isAdStatus(normalizedStatus)) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "status must be pending or approved or rejected only"
        );
        res.status(400).json(errorResponse);
        return;
      }
  
      // ✅ Pagination handling (default: page=1, limit=10)
      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };
  
      let result;
  
      // ✅ Role-based factory
      if (req.user.role === UserRole.USER) {
        result = await this.advertisingService.listAdsForUser(
          normalizedStatus,
          req.user.id,
          pagination
        );
      } else if (req.user.role === UserRole.ADMIN) {
        result = await this.advertisingService.listAdsForAdmin(
          normalizedStatus,
          pagination
        );
      } else {
        res.status(403).json({ error: "Forbidden: role not allowed" });
        return;
      }
  
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to list ads", message: error.message });
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

    const result = await this.advertisingService.getAdsByTitle(title.toString(), pagination);

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch ads by title", message: error.message });
  }
}


  // ✅ Update Ad
  async updateAd(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.advertisingService.updateAd(
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
      const result = await this.advertisingService.deleteAd(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete ad", message: error.message });
    }
  }

  // Approve Ad (Admin only)
  async approveAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user.role !== UserRole.ADMIN) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.FORBIDDEN,
          "Invalid or missing status field"
        );
        res.status(403).json(errorResponse);
        return;
      }

      const result = await this.advertisingService.approveAd(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to approve ad", message: error.message });
    }
  }

  // Reject Ad (Admin only)
  async rejectAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }

      const { reason } = req.body;
      const result = await this.advertisingService.rejectAd(req.params.id, reason);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject ad", message: error.message });
    }
  }
}