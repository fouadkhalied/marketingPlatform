import { IBlogRepository } from '../../domain/repositories/blog.repository.interface';
import { BlogModel, IBlog } from '../../../../infrastructure/shared/schema/blog.schema';
import { CreateBlogDto } from '../../application/dto/create-blog.dto';
import { UpdateBlogDto } from '../../application/dto/update-blog.dto';
import { BlogPaginationDto, PaginatedBlogResponse } from '../../application/dto/blog-pagination.dto';
import mongoose from 'mongoose';

export class BlogRepository implements IBlogRepository {
  async create(blogData: CreateBlogDto & { author: { id: string; name: string; email: string } }): Promise<IBlog> {
    const blog = new BlogModel(blogData);
    console.log(blog);
    
    return await blog.save();
  }

  async findById(id: string): Promise<IBlog | null> {
    return await BlogModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<IBlog | null> {
    // Search in both English and Arabic slugs
    return await BlogModel.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.ar': slug }
      ]
    }).exec();
  }

  async findAll(params: BlogPaginationDto): Promise<PaginatedBlogResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      tag,
      author,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Build query
    const query: any = {};

    if (status) query.status = status;
    
    // Handle bilingual category search
    if (category) {
      query.$or = [
        { 'category.en': category },
        { 'category.ar': category }
      ];
    }
    
    if (author) query['author.id'] = author;
    
    // Handle bilingual tag search
    if (tag) {
      query.$or = [
        { 'tags.en': tag },
        { 'tags.ar': tag }
      ];
    }
    
    // Handle bilingual text search
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ar': { $regex: search, $options: 'i' } },
        { 'content.en': { $regex: search, $options: 'i' } },
        { 'content.ar': { $regex: search, $options: 'i' } },
        { 'excerpt.en': { $regex: search, $options: 'i' } },
        { 'excerpt.ar': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      BlogModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      BlogModel.countDocuments(query).exec()
    ]);

    console.log(query);
    console.log(blogs);

    const totalPages = Math.ceil(total / limit);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async update(id: string, updateData: UpdateBlogDto): Promise<IBlog | null> {
    console.log('ID:', id);
    console.log('Update Data:', updateData);
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid blog ID format');
    }
    
    try {
      // Find the document first
      const blog = await BlogModel.findById(id);
      
      if (!blog) {
        console.log('Blog not found');
        return null;
      }
      
      console.log('Before update:', blog.title);
      
      // Update fields manually (this preserves nested structure)
      if (updateData.title) {
        blog.title = {
          ...blog.title,
          ...updateData.title
        };
      }
      
      if (updateData.content) {
        blog.content = {
          ...blog.content,
          ...updateData.content
        };
      }
      
      if (updateData.excerpt) {
        blog.excerpt = {
          ...blog.excerpt,
          ...updateData.excerpt
        };
      }
      
      if (updateData.slug) {
        blog.slug = {
          ...blog.slug,
          ...updateData.slug
        };
      }
      
      if (updateData.tags) {
        blog.tags = updateData.tags;
      }
      
      if (updateData.category) {
        blog.category = {
          ...blog.category,
          ...updateData.category
        };
      }
      
      if (updateData.featuredImage !== undefined) {
        blog.featuredImage = updateData.featuredImage;
      }
      
      if (updateData.status) {
        blog.status = updateData.status;
      }
      
      // Mark modified (important for nested objects!)
      blog.markModified('title');
      blog.markModified('content');
      blog.markModified('excerpt');
      blog.markModified('slug');
      blog.markModified('tags');
      blog.markModified('category');
      
      // Save the document (this triggers pre-save hooks and validation)
      const saved = await blog.save();
      
      console.log('After save:', saved.title);
      
      return saved;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await BlogModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async incrementViews(id: string): Promise<void> {
    await BlogModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
  }

  async incrementLikes(id: string): Promise<void> {
    await BlogModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }).exec();
  }

  async findByAuthor(authorId: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse> {
    const query = { ...params, author: authorId };
    return await this.findAll(query);
  }

  async findByCategory(category: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse> {
    const query = { ...params, category };
    return await this.findAll(query);
  }

  async findByTag(tag: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse> {
    const query = { ...params, tag };
    return await this.findAll(query);
  }
}