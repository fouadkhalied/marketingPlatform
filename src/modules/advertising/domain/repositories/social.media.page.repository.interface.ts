import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";

// ============================================
// Social Media Pages Management
// ============================================

export interface ISocialMediaPageRepository {
  getAllPagesForUser(
    isActive: boolean,
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<autheticatedPage>>;

  getPageAccessTokenById(userId: string, pageId: string): Promise<string | null>;
}
