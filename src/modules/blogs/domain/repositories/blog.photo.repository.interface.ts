// ============================================
// Blog Photo Management
// ============================================

export interface IBlogPhotoRepository {
  addPhotoToBlog(id: string, photo: string[]): Promise<boolean>;
  deletePhotoFromBlog(id: string, userId: string, photoUrl: string): Promise<boolean>;
  updatePhotoFromBlog(
    id: string,
    userId: string,
    newPhotoUrl: string,
    oldPhotoUrl: string,
    role: string
  ): Promise<boolean>;
}
