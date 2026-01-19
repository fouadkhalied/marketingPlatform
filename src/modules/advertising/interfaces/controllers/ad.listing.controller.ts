import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { KSA_CITIES } from "../../domain/enums/ksa.enum";
import { AdStatus } from "../../domain/enums/ads.status.enum";
import { AdListingAppService } from "../../application/services/ad.listing-app.service";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdListingController {
  constructor(
    private readonly adListingService: AdListingAppService,
    private readonly logger: ILogger
  ) { }

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

  // ✅ List Ads
  async listAds(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const { limit, page, status, title, description, email } = req.query;

      // ✅ Normalize status into a string
      const normalizedStatus = typeof status === "string" && status.trim() !== ""
        ? status.trim()
        : "all"; // 👈 always a string now

      // ✅ Validate only if it's not "all"
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
        result = await this.adListingService.listAdsForUser(
          normalizedStatus,
          req.user.id,
          pagination
        );
      } else if (req.user.role === UserRole.ADMIN) {
        result = await this.adListingService.listAdsForAdmin(
          normalizedStatus,
          pagination,
          title as string | undefined,
          description as string | undefined,
          email as string | undefined
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

  async listAdsFeed(req: Request, res: Response): Promise<void> {
    try {
      let { limit, page, targetCities, title, description, targetAudience, source } = req.query;

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
      const result = await this.adListingService.listAdsFeed(
        pagination,
        citiesArray,
        typeof title === 'string' ? title : undefined,
        typeof description === 'string' ? description : undefined,
        typeof targetAudience === 'string' ? targetAudience : undefined,
        typeof source === 'string' ? source : undefined
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


  async listApprovedAdsForUser(req: Request, res: Response): Promise<void> {
    try {
      let { limit, page, targetCities, title, description, targetAudience, source } = req.query;

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
      const result = await this.adListingService.listApprovedAdsForUser(
        pagination,
        citiesArray,
        typeof title === 'string' ? title : undefined,
        typeof description === 'string' ? description : undefined,
        typeof targetAudience === 'string' ? targetAudience : undefined,
        typeof source === 'string' ? source : undefined
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
}
