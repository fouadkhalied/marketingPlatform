// ============================================
// Ad Photo Management
// ============================================

export interface IAdPhotoRepository {
  addPhotoToAd(id: string, photo: string[]): Promise<boolean>;
  deletePhotoFromAd(id: string, userId: string, photoUrl: string): Promise<boolean>;
  updatePhotoFromAd(
    id: string,
    userId: string,
    newPhotoUrl: string,
    oldPhotoUrl: string,
    role: string
  ): Promise<boolean>;
}
