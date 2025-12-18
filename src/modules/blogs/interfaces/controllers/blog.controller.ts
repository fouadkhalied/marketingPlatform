import { Request, Response } from 'express';
import { BlogAppService } from '../../application/services/blog-app.service';
import { CreateBlogSchema } from '../../application/dto/create-blog.dto';
import { UpdateBlogSchema } from '../../application/dto/update-blog.dto';
import { BlogPaginationSchema } from '../../application/dto/blog-pagination.dto';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class BlogController {
  constructor(private readonly blogService: BlogAppService) {}

  async createBlog(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CreateBlogSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const blogData = validationResult.data;
      const author = {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email
      };

      const result = await this.blogService.createBlog(blogData, author);

      res.status(201).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getBlogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const incrementViews = req.query.incrementViews === 'true';

      const result = await this.blogService.getBlogById(id, incrementViews);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getBlogBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const incrementViews = req.query.incrementViews === 'true';

      const result = await this.blogService.getBlogBySlug(slug, incrementViews);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getAllBlogs(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = BlogPaginationSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const params = validationResult.data;

      const result = await this.blogService.getAllBlogs(params);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async updateBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const validationResult = UpdateBlogSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const updateData = validationResult.data;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      const result = await this.blogService.updateBlog(id, updateData, userId, isAdmin);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async deleteBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      const result = await this.blogService.deleteBlog(id, userId, isAdmin);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async likeBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.blogService.likeBlog(id);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getBlogsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;

      const validationResult = BlogPaginationSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const params = validationResult.data;

      const result = await this.blogService.getBlogsByAuthor(authorId, params);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getBlogsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;

      const validationResult = BlogPaginationSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const params = validationResult.data;

      const result = await this.blogService.getBlogsByCategory(category, params);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }

  async getBlogsByTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag } = req.params;

      const validationResult = BlogPaginationSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.VALIDATION_FAILED, 'Validation failed', validationResult.error.errors));
        return;
      }

      const params = validationResult.data;

      const result = await this.blogService.getBlogsByTag(tag, params);

      res.status(200).json(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error && !error.success) {
        const statusCode = (error as any).error?.details?.httpStatus || 500;
        res.status(statusCode).json(error);
      } else {
        res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error'));
      }
    }
  }
}
