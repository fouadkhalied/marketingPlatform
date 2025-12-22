import express from 'express';
import multer from "multer";
import { AuthMiddleware } from "../../../../infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";

const upload = multer();

export function setupAdvertisingRoutes(advertisingController: any) {
  const router = express.Router();

  // Ad Search (most specific)
  router.get("/api/advertising/search", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adCrud.getAdsByTitle(req, res)
  );

  // Ad Listing routes (specific paths)
  router.get("/api/advertising/listApprovedAdsForUser", 
    (req, res) => advertisingController.adListing.listApprovedAdsForUser(req, res)
  );

  router.get("/api/advertising/list", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adListing.listAds(req, res)
  );

  // Social Media routes (specific nested paths)
  router.get("/api/advertising/list/userPages", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.socialMedia.getAllPagesForUser(req, res)
  );

  router.get("/api/advertising/list/pages/:pageId/posts", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.socialMedia.getPostsFromPage(req, res)
  );

  router.get("/api/advertising/insights/pages/:pageId/posts/:postId", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.socialMedia.getPostInsights(req, res)
  );

  // Ad Photo routes (specific paths with :id at the end)
  router.post('/api/advertising/uploadPhoto/:id', 
    AuthMiddleware(UserRole.USER), 
    upload.array("photo"), 
    (req, res) => advertisingController.adPhoto.uploadPhotoToAd(req, res)
  );

  router.delete('/api/advertising/deletePhoto/:id', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adPhoto.deletePhotoFromAd(req, res)
  );

  router.put('/api/advertising/updatePhoto/:id', 
    AuthMiddleware(UserRole.USER), 
    upload.array("photo"), 
    (req, res) => advertisingController.adPhoto.updatePhotoFromAd(req, res)
  );

  // ============================================
  // POST ROUTES (before dynamic GET :id)
  // ============================================

  // Create ad
  router.post('/api/advertising', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adCrud.createAd(req, res)
  );

  // Assign credit to ad
  router.post("/api/advertising/:id/assign-credit", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adPromotion.assignCreditToAd(req, res)
  );

  // ============================================
  // PUT ROUTES WITH SPECIFIC ACTIONS (before generic PUT :id)
  // ============================================

  // Ad Status routes
  router.put("/api/advertising/:id/approve", 
    AuthMiddleware(UserRole.ADMIN), 
    (req, res) => advertisingController.adStatus.approveAd(req, res)
  );

  router.put("/api/advertising/:id/reject", 
    AuthMiddleware(UserRole.ADMIN), 
    (req, res) => advertisingController.adStatus.rejectAd(req, res)
  );

  router.put("/api/advertising/:id/activate", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adStatus.avctivateAd(req, res)
  );

  router.put('/api/advertising/:id/deactivate', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adStatus.deactivateUserAd(req, res)
  );

  // Ad Promotion routes
  router.put('/api/advertising/:id/promote', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adPromotion.promoteAd(req, res)
  );

  router.put('/api/advertising/:id/depromote', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adPromotion.depromoteAd(req, res)
  );

  // ============================================
  // GENERIC CRUD ROUTES WITH :id (LAST to avoid conflicts)
  // ============================================

  // Get single ad by ID
  router.get("/api/advertising/:id", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adCrud.getAd(req, res)
  );

  // Update ad
  router.put("/api/advertising/:id", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adCrud.updateAd(req, res)
  );

  // Delete ad
  router.delete("/api/advertising/:id", 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.adCrud.deleteAd(req, res)
  );

  // ============================================
  // PIXEL ROUTES (separate resource, properly ordered)
  // ============================================

  // Specific pixel routes first
  router.get('/api/pixels/generate-code-for-all-pixels', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.pixel.generatePixelCodeForAllPixels(req, res)
  );

  // List all pixels
  router.get('/api/pixels', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.pixel.getAllPixels(req, res)
  );

  // Create pixel
  router.post('/api/pixels', 
    AuthMiddleware(UserRole.ADMIN), 
    (req, res) => advertisingController.pixel.createPixelApp(req, res)
  );

  // Specific pixel action routes (before generic :id routes)
  router.get('/api/pixels/:id/generate-code', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.pixel.generatePixelCode(req, res)
  );

  // Generic pixel CRUD with :id (last)
  router.get('/api/pixels/:id', 
    AuthMiddleware(UserRole.USER), 
    (req, res) => advertisingController.pixel.getPixelById(req, res)
  );

  router.put('/api/pixels/:id', 
    AuthMiddleware(UserRole.ADMIN), 
    (req, res) => advertisingController.pixel.updatePixel(req, res)
  );

  router.delete('/api/pixels/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => advertisingController.pixel.deletePixel(req, res)
  );


  
  // Ads Package routes
  router.post('/api/ads-packages',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => advertisingController.adsPackage.createAdsPackage(req, res)
  );

  router.get('/api/ads-packages',
    AuthMiddleware(UserRole.USER),
    (req, res) => advertisingController.adsPackage.getAllAdsPackages(req, res)
  );

  router.get('/api/ads-packages/:id',
    AuthMiddleware(UserRole.USER),
    (req, res) => advertisingController.adsPackage.getAdsPackage(req, res)
  );

  router.put('/api/ads-packages/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => advertisingController.adsPackage.updateAdsPackage(req, res)
  );

  router.delete('/api/ads-packages/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => advertisingController.adsPackage.deleteAdsPackage(req, res)
  );

  return router;
}