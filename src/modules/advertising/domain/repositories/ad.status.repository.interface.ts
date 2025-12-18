import { Ad } from "../../../../infrastructure/shared/schema/schema";
import { ApproveAdData } from "../../application/dto/approveAdData";

// ============================================
// Ad Status Management
// ============================================

export interface IAdStatusRepository {
  approveAd(id: string, data?: ApproveAdData): Promise<Ad>;
  rejectAd(id: string, reason?: string): Promise<Ad>;
  activateAd(id: string): Promise<Ad>;
  activateUserAd(id: string, userId: string): Promise<Ad>;
  deactivateUserAd(userId: string, adId: string): Promise<Ad>;
  deactivateUserAdByAdmin(userId: string, adId: string): Promise<Ad>;
}
