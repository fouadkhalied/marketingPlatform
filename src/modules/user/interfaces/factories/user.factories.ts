// user/interfaces/controllers/user.controller.factory.ts
import { UserAppService } from "../../application/services/user-app.service";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";
import { UserController } from "../controllers/user.controller";

// Factory function to create the fully wired controller
export function createUserController(): UserController {
  // 1. Create repository implementation (infrastructure)
  const userRepository = new UserRepositoryImpl();

  // 2. Pass repository to application service
  const userService = new UserAppService(userRepository);

  // 3. Pass application service to controller
  const userController = new UserController(userService);

  return userController;
}
