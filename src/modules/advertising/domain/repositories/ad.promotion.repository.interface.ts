import { Ad } from "../../../../infrastructure/shared/schema/schema";

// ============================================
// Ad Promotion & Credit Management
// ============================================

export interface IAdPromotionRepository {
  promoteAd(id: string, userId: string): Promise<Ad>;
  dePromoteAd(id: string, userId: string): Promise<Ad>;
  assignCreditToAd(userId: string, adId: string, credit: number): Promise<Ad | null>;
  hasSufficientBalance(userId: string, credit: number): Promise<boolean>;
}
