import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";
import { SocialMediaAppService } from "../../application/services/social.media-app.service";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class SocialMediaController {
  constructor(
    private readonly socialMediaService: SocialMediaAppService,
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

      const result = await this.socialMediaService.listPagesForUser(
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

      const posts = await this.socialMediaService.listPostsFromPageForUser(
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

      const result = await this.socialMediaService.getPostInsights(userId, pageId, postId);

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
}
