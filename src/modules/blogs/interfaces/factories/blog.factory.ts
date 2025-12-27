import { BlogRepository } from '../../infrastructure/repositories/blog.repository';
import { BlogPhotoRepository } from '../../infrastructure/repositories/blog.photo.repository';
import { BlogAppService } from '../../application/services/blog-app.service';
import { BlogPhotoAppService } from '../../application/services/blog.photo-app.service';
import { BlogController } from '../controllers/blog.controller';
import { BlogPhotoController } from '../controllers/blog.photo.controller';
import { UploadPhoto, BucketType } from '../../../../infrastructure/shared/common/supabase/module/supabase.module';
import { SupabaseUploader } from '../../../../infrastructure/shared/common/supabase/module/supabaseUploader.module';
import { createLogger } from '../../../../infrastructure/shared/common/logging';

// Repository Factories
export function createBlogRepository(): BlogRepository {
  return new BlogRepository();
}

export function createBlogPhotoRepository(): BlogPhotoRepository {
  return new BlogPhotoRepository();
}

// Service Factories
export function createBlogAppService(): BlogAppService {
  const blogRepository = createBlogRepository();
  const supabaseUploader = new SupabaseUploader(BucketType.BLOG);
  const photoUploader = new UploadPhoto(supabaseUploader, BucketType.BLOG);

  return new BlogAppService(blogRepository, photoUploader);
}

export function createBlogPhotoAppService(): BlogPhotoAppService {
  const photoRepository = createBlogPhotoRepository();
  const logger = createLogger();
  const supabaseUploader = new SupabaseUploader(BucketType.BLOG);
  const photoUploader = new UploadPhoto(supabaseUploader, BucketType.BLOG);

  return new BlogPhotoAppService(photoRepository, photoUploader, logger);
}

// Controller Factories
export function createBlogController(): BlogController {
  return new BlogController(createBlogAppService());
}

export function createBlogPhotoController(): BlogPhotoController {
  const photoService = createBlogPhotoAppService();
  const logger = createLogger();

  return new BlogPhotoController(photoService, logger);
}

// Combined Factory for all blog components
export function createBlogComponents() {
  const repository = createBlogRepository();
  const service = new BlogAppService(repository);
  const controller = new BlogController(service);

  return {
    repository,
    service,
    controller
  };
}

// Combined Factory for all blog components including photo management
export function createBlogComponentsWithPhoto() {
  // Shared components for both blog and photo services
  const supabaseUploader = new SupabaseUploader(BucketType.BLOG);
  const photoUploader = new UploadPhoto(supabaseUploader, BucketType.BLOG);
  const logger = createLogger();

  // Blog components
  const blogRepository = createBlogRepository();
  const blogService = new BlogAppService(blogRepository, photoUploader);
  const blogController = new BlogController(blogService);

  // Photo components
  const photoRepository = createBlogPhotoRepository();
  const photoService = new BlogPhotoAppService(photoRepository, photoUploader, logger);
  const photoController = new BlogPhotoController(photoService, logger);

  return {
    // Blog components
    blogRepository,
    blogService,
    blogController,
    // Photo components
    photoRepository,
    photoService,
    photoController,
    // Combined controllers for routing
    controllers: {
      blog: blogController,
      photo: photoController
    }
  };
}
