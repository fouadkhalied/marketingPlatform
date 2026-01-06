import { IBlog } from '../../../../infrastructure/shared/schema/blog.mongo';
import { CreateBlogDto } from '../../application/dto/create-blog.dto';
import { UpdateBlogDto } from '../../application/dto/update-blog.dto';
import { BlogPaginationDto, PaginatedBlogResponse } from '../../application/dto/blog-pagination.dto';

export interface IBlogRepository {
  create(blogData: CreateBlogDto & { author: { id: string; name: string; email: string } }): Promise<IBlog>;
  findById(id: string): Promise<IBlog | null>;
  findBySlug(slug: string): Promise<IBlog | null>;
  findAll(params: BlogPaginationDto): Promise<PaginatedBlogResponse>;
  update(id: string, updateData: UpdateBlogDto): Promise<IBlog | null>;
  delete(id: string): Promise<boolean>;
  incrementViews(id: string): Promise<void>;
  incrementLikes(id: string): Promise<void>;
  findByAuthor(authorId: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse>;
  findByCategory(category: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse>;
  findByTag(tag: string, params: BlogPaginationDto): Promise<PaginatedBlogResponse>;
}
