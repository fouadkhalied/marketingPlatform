import { Request, Response } from "express";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdStatus } from "../../domain/enums/ads.status.enum";
import { ApproveAdData } from "../../application/dto/approveAdData";
import { KSA_CITIES } from "../../domain/enums/ksa.enum";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";
import { PixelPlatform } from "../../../../infrastructure/shared/common/pixel/interface/pixelPlatform.enum";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdvertisingController {
  constructor(
    private readonly advertisingService: AdvertisingAppService,
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
      const response = await this.advertisingService.uploadPhotoToAd(files, id);
  
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
      const response = await this.advertisingService.updatePhotoFromAd(files,id,req.user.id,photoUrl,req.user.role);
  
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
      const response = await this.advertisingService.deletePhotoFromAd(id, req.user.id, photoUrl);
  
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

  async listApprovedAdsForUser(req: Request, res: Response): Promise<void> {
    try {
      let { limit, page, targetCities, title , description, targetAudience , source} = req.query;

      if (source && !PixelPlatform.includes(source.toString().toLowerCase())) {
        source = "unknown"
      }
  
      // ✅ Pagination handling (default: page=1, limit=6)
      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 6,
      };
  
      // ✅ Parse targetCities from query string
      let citiesArray: string[] = [];

if (targetCities) {
  if (Array.isArray(targetCities)) {
    citiesArray = targetCities.filter((c): c is string => typeof c === 'string');
  } else if (typeof targetCities === 'string') {
    try {
      // Try to parse JSON array string: ["mecca","riyadh"]
      const parsed = JSON.parse(targetCities);
      if (Array.isArray(parsed)) {
        citiesArray = parsed.filter((c): c is string => typeof c === 'string');
      } else {
        citiesArray = targetCities.split(',').map(c => c.trim()).filter(Boolean);
      }
    } catch {
      // fallback if not JSON
      citiesArray = targetCities.split(',').map(c => c.trim()).filter(Boolean);
    }
  }
}

  
      // ✅ Validate cities against KSA_CITIES
      if (citiesArray.length > 0) {
        const isValid = citiesArray.every((city: string) => 
          KSA_CITIES.includes(city as any)
        );
        
        if (!isValid) {
          res.status(400).json({ 
            error: "Invalid cities provided",
            validCities: KSA_CITIES 
          });
          return;
        }
      }
  
      // ✅ Pass validated cities array to service
      const result = await this.advertisingService.listApprovedAdsForUser(
        pagination,
        citiesArray,
        typeof title === 'string' ? title : undefined,
        typeof description === 'string' ? description : undefined,
        typeof targetAudience === 'string'? targetAudience : undefined,
        typeof source === 'string'? source : undefined
      );
                                  
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to list ads", 
        message: error.message 
      });
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

      const result = await this.advertisingService.deleteAd(req.params.id, req.user.id, req.user.role);

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
        "Only admins can approve ads"
      );
      res.status(403).json(errorResponse);
      return;
    }

    const { id } = req.params;
    const socialMediaLinks = req.body;

    // Filter out undefined/null values and only pass valid links
    const validLinks: ApproveAdData = {};
    if (socialMediaLinks?.tiktokLink) validLinks.tiktokLink = socialMediaLinks.tiktokLink;
    if (socialMediaLinks?.youtubeLink) validLinks.youtubeLink = socialMediaLinks.youtubeLink;
    if (socialMediaLinks?.googleAdsLink) validLinks.googleAdsLink = socialMediaLinks.googleAdsLink;
    if (socialMediaLinks?.instagramLink) validLinks.instagramLink = socialMediaLinks.instagramLink;
    if (socialMediaLinks?.facebookLink) validLinks.facebookLink = socialMediaLinks.facebookLink;
    if (socialMediaLinks?.snapchatLink) validLinks.snapchatLink = socialMediaLinks.snapchatLink;

    const result = await this.advertisingService.approveAd(
      id,
      Object.keys(validLinks).length > 0 ? validLinks : undefined
    );

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error("Error approving ad:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to approve ad",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve ad",
        details: error.message
      }
    });
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

  // activate ad
  async avctivateAd(req: Request, res: Response): Promise<void> {
    try {

      if (!req.user?.id) {
        res.status(403).json(ErrorBuilder.build(ErrorCode.UNAUTHORIZED, "user unauthorized"));
        return;
      }

      if (!req.params.id) {
        res.status(404).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "ad id must be provided"));
        return;
      }

      const result = await this.advertisingService.activateAd(req.params.id, req.user.id ,req.user.role);

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



// Add to UserController class
async deactivateUserAd(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ad ID is required',
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Ad ID is required'
        }
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "User must be authenticated",
        error: {
          code: "UNAUTHORIZED",
          message: "User must be authenticated"
        }
      });
      return;
    }

    const userId = req.user.id;
    const role = req.user.role;

    const result = await this.advertisingService.deactivateUserAd(userId, id, role);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error deactivating ad:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate ad',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate ad',
        details: err.message
      }
    });
  }
}

async promoteAd(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ad ID is required',
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Ad ID is required'
        }
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "User must be authenticated",
        error: {
          code: "UNAUTHORIZED",
          message: "User must be authenticated"
        }
      });
      return;
    }

    const userId = req.user.id;

    const result = await this.advertisingService.promoteAd(userId,id);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error deactivating ad:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate ad',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate ad',
        details: err.message
      }
    });
  }
}


async depromoteAd(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ad ID is required',
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Ad ID is required'
        }
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "User must be authenticated",
        error: {
          code: "UNAUTHORIZED",
          message: "User must be authenticated"
        }
      });
      return;
    }

    const userId = req.user.id;

    const result = await this.advertisingService.dePromoteAd(userId,id);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error deactivating ad:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate ad',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate ad',
        details: err.message
      }
    });
  }
}

  async createPixelApp(req: Request, res: Response): Promise<void> {
    try {
      const pixelData: pixel = req.body;

      // ✅ Step 1: Basic validation
      if (!pixelData.name || !pixelData.pixelId || !pixelData.platform) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, pixelId, or platform',
        });
        return;
      }

      // ✅ Step 2: Validate platform enum value
      if (!Object.values(PixelPlatform).includes(pixelData.platform)) {
        res.status(400).json({
          success: false,
          message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
        });
        return;
      }

      
    const result = await this.advertisingService.createPixel(pixelData);

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);
      
    } catch (err: any) {
      console.error('Error creating pixel app:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to create pixel app',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }


  // Controller Layer - Add to your controller file

async getPixelById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid pixel ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid pixel ID is required',
        },
      });
      return;
    }

    const result = await this.advertisingService.getPixelById(id);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error retrieving pixel:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pixel',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}

async getAllPixels(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: 'Page number must be greater than 0',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Page number must be greater than 0',
        },
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Limit must be between 1 and 100',
        },
      });
      return;
    }

    const result = await this.advertisingService.getAllPixels({ page, limit });
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error retrieving pixels:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pixels',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}

async updatePixel(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateData: Partial<pixel> = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid pixel ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid pixel ID is required',
        },
      });
      return;
    }

    // Validate that at least one field is being updated
    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No update data provided',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided for update',
        },
      });
      return;
    }

    // Validate platform if provided
    if (updateData.platform && !Object.values(PixelPlatform).includes(updateData.platform)) {
      res.status(400).json({
        success: false,
        message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
        },
      });
      return;
    }

    const result = await this.advertisingService.updatePixel(id, updateData);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error updating pixel:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to update pixel',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}

async deletePixel(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid pixel ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid pixel ID is required',
        },
      });
      return;
    }

    const result = await this.advertisingService.deletePixel(id);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error deleting pixel:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to delete pixel',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}

// Controller Layer - Add to your controller file

async generatePixelCode(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid pixel ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid pixel ID is required',
        },
      });
      return;
    }

    const result = await this.advertisingService.generatePixelCode(id);
    const statusCode = this.getStatusCode(result);

    res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('Error generating pixel code:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to generate pixel code',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}

async generatePixelCodeForAllPixels(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: 'Page number must be greater than 0',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Page number must be greater than 0',
        },
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Limit must be between 1 and 100',
        },
      });
      return;
    }
    
    const pixels = await this.advertisingService.getAllPixels({ page, limit });

    // Check if pixels data exists
    if (!pixels.data || pixels.data.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No pixels found'
      });
      return;
    }

    // Generate pixel codes for all pixels
    const pixelCodes = await Promise.all(
      pixels.data.map(async (pixel) => {
        return await this.advertisingService.generatePixelCode(pixel.id);
      })
    );

    // Return the results with pagination info
    res.status(200).json({
      success: true,
      message: 'Pixel codes generated successfully',
      data: pixelCodes.map((data)=> data.data?.code),
    });
  } catch (err: any) {
    console.error('Error generating pixel codes:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to generate pixel codes',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  }
}
}
