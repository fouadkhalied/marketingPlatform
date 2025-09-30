import { JwtService } from '../../../../infrastructure/shared/common/auth/module/jwt.module';
import { AuthService } from '../../application/services/auth-app.service';
import { GoogleAppService } from '../../application/services/google-app-service';
import { GoogleRepositoryImpl } from '../../infrastructure/repositories/google.repository.impl';
import { AuthController } from '../controllers/auth.controller';

export function createAuthController(): AuthController {
    const googleRepository = new GoogleRepositoryImpl();
    const jwtService = new JwtService();
    const googleService = new GoogleAppService(googleRepository, jwtService);
    const authService = new AuthService(googleService);
    return new AuthController(authService);
}
