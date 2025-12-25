import { IBlogRepository } from '../../domain/repositories/blog.repository.interface';
import { BlogModel, IBlog } from '../../../../infrastructure/shared/schema/blog.schema';
import { CreateBlogDto } from '../../application/dto/create-blog.dto';
import { UpdateBlogDto } from '../../application/dto/update-blog.dto';
import { BlogPaginationDto, PaginatedBlogResponse } from '../../application/dto/blog-pagination.dto';

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
    return await BlogModel.findOne({ slug }).exec();
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
    if (category) query.category = category;
    if (author) query['author.id'] = author;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
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
    return await BlogModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
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
