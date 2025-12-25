import express from 'express';
import { AuthMiddleware } from '../../../../infrastructure/shared/common/auth/module/authModule';
import { UserRole } from '../../../../infrastructure/shared/common/auth/enums/userRole';
import { BlogController } from '../controllers/blog.controller';

export interface IBlogController {
  createBlog(req: express.Request, res: express.Response): Promise<void>;
  getBlogById(req: express.Request, res: express.Response): Promise<void>;
  getBlogBySlug(req: express.Request, res: express.Response): Promise<void>;
  getAllBlogs(req: express.Request, res: express.Response): Promise<void>;
  updateBlog(req: express.Request, res: express.Response): Promise<void>;
  deleteBlog(req: express.Request, res: express.Response): Promise<void>;
  likeBlog(req: express.Request, res: express.Response): Promise<void>;
  getBlogsByAuthor(req: express.Request, res: express.Response): Promise<void>;
  getBlogsByCategory(req: express.Request, res: express.Response): Promise<void>;
  getBlogsByTag(req: express.Request, res: express.Response): Promise<void>;
}

export function setupBlogRoutes(blogController: IBlogController) {
  const router = express.Router();

  // ============================================
  // PUBLIC ROUTES (No authentication required)
  // ============================================

  // Get published blogs (public access)
  router.get('/api/blogs/published', (req, res) => blogController.getAllBlogs(req, res));

  // Get blog by slug (public access with view increment)
  router.get('/api/blogs/slug/:slug', (req, res) => blogController.getBlogBySlug(req, res));

  // Like blog (public access for published blogs)
  router.post('/api/blogs/:id/like', (req, res) => blogController.likeBlog(req, res));

  // Get blogs by category (public access)
  router.get('/api/blogs/category/:category', (req, res) => blogController.getBlogsByCategory(req, res));

  // Get blogs by tag (public access)
  router.get('/api/blogs/tag/:tag', (req, res) => blogController.getBlogsByTag(req, res));

  // ============================================
  // USER ROUTES (User authentication required)
  // ============================================

  // Get blog by ID (user access with view increment)
  router.get('/api/blogs/:id', AuthMiddleware(UserRole.USER), (req, res) => blogController.getBlogById(req, res));

  // Get all blogs (including drafts for authenticated users)
  router.get('/api/blogs', AuthMiddleware(UserRole.USER), (req, res) => blogController.getAllBlogs(req, res));

  // Get blogs by author (user access)
  router.get('/api/blogs/author/:authorId', AuthMiddleware(UserRole.USER), (req, res) => blogController.getBlogsByAuthor(req, res));

  // ============================================
  // ADMIN ROUTES (Admin authentication required)
  // ============================================

  // Create blog (admin only)
  router.post('/api/blogs', AuthMiddleware(UserRole.ADMIN), (req, res) => blogController.createBlog(req, res));

  // Update blog (admin only)
  router.patch('/api/blogs/:id', AuthMiddleware(UserRole.ADMIN), (req, res) => blogController.updateBlog(req, res));

  // Delete blog (admin only)
  router.delete('/api/blogs/:id', AuthMiddleware(UserRole.ADMIN), (req, res) => blogController.deleteBlog(req, res));

  return router;
}
