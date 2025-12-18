import { BlogRepository } from '../../infrastructure/repositories/blog.repository';
import { BlogAppService } from '../../application/services/blog-app.service';
import { BlogController } from '../controllers/blog.controller';

// Repository Factory
export function createBlogRepository(): BlogRepository {
  return new BlogRepository();
}

// Service Factory
export function createBlogAppService(): BlogAppService {
  return new BlogAppService(createBlogRepository());
}

// Controller Factory
export function createBlogController(): BlogController {
  return new BlogController(createBlogAppService());
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
