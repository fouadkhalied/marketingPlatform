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

  // ✅ Get All Pages For User
async getAllPagesForUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const { page, limit, isActive } = req.query;

    // ✅ Pagination handling
    const pagination: PaginationParams = {
      page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
      limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
    };

    // ✅ Validate isActive
    if (typeof isActive === "undefined" || !["true", "false"].includes(isActive.toString())) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "isActive query parameter is required"
      );
      res.status(400).json(errorResponse);
      return;
    }

    const isActiveBool = isActive === "true" || isActive === "1";

    const result = await this.advertisingService.listPagesForUser(
      isActiveBool,
      req.user.id,
      pagination
    );

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch pages", message: error.message });
  }
}


async getPostsFromPage(req: Request, res: Response) {
  try {
    const  userId  = req.user?.id; // from Auth middleware
    const { pageId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    if (!userId || !pageId) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "userId and pageId are required"
      );
      return res.status(400).json(errorResponse);
    }

    const pagination: PaginationParams = {
      page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
      limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
    };

    const posts = await this.advertisingService.listPostsFromPageForUser(
      userId,
      pageId,
      pagination
    );

    const statusCode = this.getStatusCode(posts);
    res.status(statusCode).json(posts);
  } catch (err: any) {
    console.error("Error in getPostsFromPage:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async getPostInsights(req: Request, res: Response): Promise<void> {
  try {
    const { pageId, postId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.UNAUTHORIZED,
        "userId and pageId are required"
      );
      res.status(400).json(errorResponse);
    }

    const result = await this.advertisingService.getPostInsights(userId, pageId, postId);
    
    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
  } catch (error) {
    const errorResponse = ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "Failed to get post insights",
      error instanceof Error ? error.message : error
    );
    res.status(500).json(errorResponse);
  }
}



// ✅ Assign credit to an Ad (deduct from user balance + add to ad)
async assignCreditToAd(req: Request, res: Response): Promise<void> {
  try {

    if (!req.user?.id) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const adId = req.params.id;
    const { credit , budgetType} = req.body;

    // Validate Ad ID (must be non-empty string)
    if (!adId || typeof adId !== "string" || adId.trim().length === 0) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Valid adId is required in URL"
      );
      res.status(400).json(errorResponse);
      return;
    }

    // Validate credit (must be positive number)
    if (!credit || isNaN(Number(credit)) || Number(credit) <= 0) {
      const errorResponse = ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Positive credit amount is required"
      );
      res.status(400).json(errorResponse);
      return;
    }

    const result = await this.advertisingService.assignCreditToAd(
      req.user.id,
      adId,
      Number(credit)
    );

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to assign credit to ad",
      message: error.message,
    });
  }
}

}