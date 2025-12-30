import { db } from "../../../../infrastructure/db/connection";
import { IAdReport } from "../../domain/repositories/user.repository";

import { desc } from "drizzle-orm";
import { adsReport, AdsReport } from "../../../../infrastructure/shared/schema/schema";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AdReportRepository implements IAdReport {
  async createAdReport(adId: string, email: string, username: string, phoneNumber: string, reportDescription: string): Promise<boolean> {
    try {
      const [report] = await db
        .insert(adsReport)
        .values({ adId, email, username, phoneNumber, reportDescription })
        .returning();
      return !!report;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to create ad report",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdReports(pagination: PaginationParams): Promise<PaginatedResponse<AdsReport>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      const reports = await db
        .select({
          id: adsReport.id,
          adId: adsReport.adId,
          email: adsReport.email,
          username: adsReport.username,
          phoneNumber: adsReport.phoneNumber,
          reportDescription: adsReport.reportDescription,
          createdAt: adsReport.createdAt,
        })
        .from(adsReport)
        .orderBy(desc(adsReport.createdAt))
        .limit(limit)
        .offset(offset);
      return {
        data: reports as AdsReport[],
          pagination: {
            currentPage: page,
            limit,
            totalCount: reports.length,
            totalPages: Math.ceil(reports.length / limit),
            hasNext: page < Math.ceil(reports.length / limit),
            hasPrevious: page > 1,
          },
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to get ad reports",
        error instanceof Error ? error.message : error
      );
    }
  }
}
