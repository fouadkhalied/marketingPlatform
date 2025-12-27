import { IBlogPhotoRepository } from '../../domain/repositories/blog.photo.repository.interface';
import { BlogModel } from '../../../../infrastructure/shared/schema/blog.schema';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class BlogPhotoRepository implements IBlogPhotoRepository {
  async addPhotoToBlog(id: string, photo: string[]): Promise<boolean> {
    try {
      console.log('Blog photo repository: Adding photo to blog', {
        blogId: id,
        photoUrls: photo,
        featuredImageUrl: photo[0]
      });

      // For blogs, we'll set the first photo as the featured image
      const result = await BlogModel.findByIdAndUpdate(
        id,
        { featuredImage: photo[0] },
        { new: true }
      ).exec();

      if (result) {
        console.log('Blog photo repository: Successfully added photo to blog', {
          blogId: id,
          featuredImageUrl: photo[0]
        });
      } else {
        console.log('Blog photo repository: Blog not found for photo addition', { blogId: id });
      }

      return !!result;
    } catch (error) {
      console.error('Blog photo repository: Error adding photo to blog', {
        blogId: id,
        photoUrls: photo,
        error: error instanceof Error ? error.message : error
      });
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to add photo to blog",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deletePhotoFromBlog(id: string, userId: string, photoUrl: string): Promise<boolean> {
    try {
      console.log('Blog photo repository: Deleting photo from blog', {
        blogId: id,
        userId,
        photoUrl
      });

      // Find the blog and verify ownership
      const blog = await BlogModel.findOne({
        _id: id,
        'author.id': userId,
        featuredImage: photoUrl
      }).exec();

      if (!blog) {
        console.log('Blog photo repository: Blog not found or user not authorized', {
          blogId: id,
          userId,
          photoUrl
        });
        return false;
      }

      console.log('Blog photo repository: Removing featured image from blog', {
        blogId: id,
        userId,
        photoUrl
      });

      // Remove the featured image
      const result = await BlogModel.findByIdAndUpdate(
        id,
        { $unset: { featuredImage: 1 } },
        { new: true }
      ).exec();

      if (result) {
        console.log('Blog photo repository: Successfully deleted photo from blog', {
          blogId: id,
          userId,
          photoUrl
        });
      }

      return !!result;
    } catch (error) {
      console.error('Blog photo repository: Error deleting photo from blog', {
        blogId: id,
        userId,
        photoUrl,
        error: error instanceof Error ? error.message : error
      });
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete photo from blog",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updatePhotoFromBlog(
    id: string,
    userId: string,
    newPhotoUrl: string,
    oldPhotoUrl: string,
    role: string
  ): Promise<boolean> {
    try {
      console.log('Blog photo repository: Updating blog photo', {
        blogId: id,
        userId,
        role,
        oldPhotoUrl,
        newPhotoUrl
      });

      // For admin or blog author, allow updating the featured image
      const updateCondition: any = {
        _id: id,
        featuredImage: oldPhotoUrl
      };

      // If not admin, verify ownership
      if (role !== 'admin') {
        updateCondition['author.id'] = userId;
        console.log('Blog photo repository: Verifying blog ownership', { blogId: id, userId });
      }

      console.log('Blog photo repository: Executing database update', {
        blogId: id,
        updateCondition,
        newPhotoUrl
      });

      const result = await BlogModel.findOneAndUpdate(
        updateCondition,
        { featuredImage: newPhotoUrl },
        { new: true }
      ).exec();

      if (result) {
        console.log('Blog photo repository: Successfully updated blog photo', {
          blogId: id,
          userId,
          oldPhotoUrl,
          newPhotoUrl
        });
      } else {
        console.log('Blog photo repository: No blog found or update failed', {
          blogId: id,
          userId,
          role,
          updateCondition
        });
      }

      return !!result;
    } catch (error) {
      console.error('Blog photo repository: Error updating blog photo', {
        blogId: id,
        userId,
        oldPhotoUrl,
        newPhotoUrl,
        error: error instanceof Error ? error.message : error
      });
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update photo in blog",
        error instanceof Error ? error.message : error
      );
    }
  }
}
