import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdsPackageAppService } from "../../application/services/ads.package-app.service";

export class AdsPackageController {
  constructor(private readonly adsPackageService: AdsPackageAppService) {}

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

  // ✅ Create Ads Package (Admin only)
  async createAdsPackage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          "User not authenticated"
        );
        res.status(this.getStatusCode(errorResponse)).json(errorResponse);
        return;
      }

      // if (req.user.role !== 'admin') {
      //   const errorResponse = ErrorBuilder.build(
      //     ErrorCode.FORBIDDEN,
      //     "Only admin can create ads packages"
      //   );
      //   res.status(this.getStatusCode(errorResponse)).json(errorResponse);
      //   return;
      // }

      const result = await this.adsPackageService.createAdsPackage(req.body, req.user.id);

      const statusCode = this.getStatusCode(result);
      const responseStatusCode = result.success ? 201 : statusCode;

      res.status(responseStatusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ads package", message: error.message });
    }
  }

  // ✅ Get Ads Package by ID (Users can access)
  async getAdsPackage(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.adsPackageService.getAdsPackageById(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch ads package", message: error.message });
    }
  }

  // ✅ Get All Ads Packages (Users can access)
  async getAllAdsPackages(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;

      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };

      const result = await this.adsPackageService.getAllAdsPackages(pagination);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch ads packages", message: error.message });
    }
  }

  // ✅ Update Ads Package (Admin only)
  async updateAdsPackage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          "User not authenticated"
        );
        res.status(this.getStatusCode(errorResponse)).json(errorResponse);
        return;
      }

      // if (req.user.role !== 'admin') {
      //   const errorResponse = ErrorBuilder.build(
      //     ErrorCode.FORBIDDEN,
      //     "Only admin can update ads packages"
      //   );
      //   res.status(this.getStatusCode(errorResponse)).json(errorResponse);
      //   return;
      // }

      const result = await this.adsPackageService.updateAdsPackage(
        req.params.id,
        req.body,
        req.user.id
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update ads package", message: error.message });
    }
  }

  // ✅ Delete Ads Package (Admin only)
  async deleteAdsPackage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          "User not authenticated"
        );
        res.status(this.getStatusCode(errorResponse)).json(errorResponse);
        return;
      }

      // if (req.user.role !== 'admin') {
      //   const errorResponse = ErrorBuilder.build(
      //     ErrorCode.FORBIDDEN,
      //     "Only admin can delete ads packages"
      //   );
      //   res.status(this.getStatusCode(errorResponse)).json(errorResponse);
      //   return;
      // }

      const result = await this.adsPackageService.deleteAdsPackage(req.params.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete ads package", message: error.message });
    }
  }
}
