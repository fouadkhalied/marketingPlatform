import { IBlogRepository } from '../../domain/repositories/blog.repository.interface';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import { BlogPaginationDto } from '../dto/blog-pagination.dto';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class BlogAppService {
  constructor(private readonly blogRepository: IBlogRepository) {}

  async createBlog(blogData: CreateBlogDto, author: { id: string; name: string; email: string }) {
    try {
      console.log(blogData);
      
      // Check if slug already exists in either language
      const slugToCheck = blogData.slug?.en || blogData.slug?.ar || 
        blogData.title.en?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
        blogData.title.ar?.replace(/\s+/g, '-').replace(/[^\u0600-\u06FF0-9-]/g, '').replace(/^-+|-+$/g, '');

      if (slugToCheck) {
        const existingBlog = await this.blogRepository.findBySlug(slugToCheck);
        if (existingBlog) {
          throw ErrorBuilder.build(ErrorCode.BLOG_TITLE_EXISTS, 'Blog with this slug already exists');
        }
      }

      const blog = await this.blogRepository.create({
        ...blogData,
        author
      });

      return {
        success: true,
        data: blog,
        message: 'Blog created successfully'
      };
    } catch (error: any) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.BLOG_CREATE_FAILED, 'Failed to create blog', error.message);
    }
  }

  async getBlogById(id: string, incrementViews: boolean = false) {
    try {
      const blog = await this.blogRepository.findById(id);

      if (!blog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_NOT_FOUND, 'Blog not found');
      }

      // Only increment views for published blogs
      if (incrementViews && blog.status === 'published') {
        await this.blogRepository.incrementViews(id);
        blog.views += 1;
      }

      return {
        success: true,
        data: blog
      };
    } catch (error) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blog');
    }
  }

  async getBlogBySlug(slug: string, incrementViews: boolean = false) {
    try {
      const blog = await this.blogRepository.findBySlug(slug);

      if (!blog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_NOT_FOUND, 'Blog not found');
      }

      // Only increment views for published blogs
      if (incrementViews && blog.status === 'published') {
        await this.blogRepository.incrementViews(blog._id.toString());
        blog.views += 1;
      }

      return {
        success: true,
        data: blog
      };
    } catch (error) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blog');
    }
  }

  async getAllBlogs(params: BlogPaginationDto) {
    try {
      const result = await this.blogRepository.findAll(params);

      return {
        success: true,
        data: result.blogs,
        pagination: result.pagination
      };
    } catch (error) {
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blogs');
    }
  }

  async updateBlog(id: string, updateData: UpdateBlogDto, userId: string, isAdmin: boolean) {
    try {
      const blog = await this.blogRepository.findById(id);

      if (!blog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_NOT_FOUND, 'Blog not found');
      }

      // Check permissions - only author or admin can update
      if (!isAdmin && blog.author.id !== userId) {
        throw ErrorBuilder.build(ErrorCode.BLOG_PERMISSION_DENIED, 'You do not have permission to update this blog');
      }

      const updatedBlog = await this.blogRepository.update(id, updateData);

      if (!updatedBlog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_UPDATE_FAILED, 'Failed to update blog');
      }

      return {
        success: true,
        data: updatedBlog,
        message: 'Blog updated successfully'
      };
    } catch (error) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.BLOG_UPDATE_FAILED, 'Failed to update blog');
    }
  }

  async deleteBlog(id: string, userId: string, isAdmin: boolean) {
    try {
      const blog = await this.blogRepository.findById(id);

      if (!blog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_NOT_FOUND, 'Blog not found');
      }

      // Check permissions - only author or admin can delete
      if (!isAdmin && blog.author.id !== userId) {
        throw ErrorBuilder.build(ErrorCode.BLOG_PERMISSION_DENIED, 'You do not have permission to delete this blog');
      }

      const deleted = await this.blogRepository.delete(id);

      if (!deleted) {
        throw ErrorBuilder.build(ErrorCode.BLOG_DELETE_FAILED, 'Failed to delete blog');
      }

      return {
        success: true,
        message: 'Blog deleted successfully'
      };
    } catch (error) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.BLOG_DELETE_FAILED, 'Failed to delete blog');
    }
  }

  async likeBlog(id: string) {
    try {
      const blog = await this.blogRepository.findById(id);

      if (!blog) {
        throw ErrorBuilder.build(ErrorCode.BLOG_NOT_FOUND, 'Blog not found');
      }

      // Only published blogs can be liked
      if (blog.status !== 'published') {
        throw ErrorBuilder.build(ErrorCode.BLOG_UNPUBLISHED_LIKE, 'Cannot like unpublished blog');
      }

      await this.blogRepository.incrementLikes(id);

      return {
        success: true,
        message: 'Blog liked successfully'
      };
    } catch (error) {
      if (error instanceof ErrorBuilder) throw error;
      throw ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to like blog');
    }
  }

  async getBlogsByAuthor(authorId: string, params: BlogPaginationDto) {
    try {
      const result = await this.blogRepository.findByAuthor(authorId, params);

      return {
        success: true,
        data: result.blogs,
        pagination: result.pagination
      };
    } catch (error) {
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blogs by author');
    }
  }

  async getBlogsByCategory(category: string, params: BlogPaginationDto) {
    try {
      const result = await this.blogRepository.findByCategory(category, params);

      return {
        success: true,
        data: result.blogs,
        pagination: result.pagination
      };
    } catch (error) {
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blogs by category');
    }
  }

  async getBlogsByTag(tag: string, params: BlogPaginationDto) {
    try {
      const result = await this.blogRepository.findByTag(tag, params);

      return {
        success: true,
        data: result.blogs,
        pagination: result.pagination
      };
    } catch (error) {
      throw ErrorBuilder.build(ErrorCode.BLOG_FETCH_FAILED, 'Failed to fetch blogs by tag');
    }
  }
}