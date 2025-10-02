import { JwtService } from '../../../../infrastructure/shared/common/auth/module/jwt.module';
import { AuthService } from '../../application/services/auth-app.service';
import FacebookAppService from '../../application/services/facebook-app-service';
import { GoogleAppService } from '../../application/services/google-app-service';
import { FacebookRepositoryImpl } from '../../infrastructure/repositories/facebook.repository.impl';
import { GoogleRepositoryImpl } from '../../infrastructure/repositories/google.repository.impl';
import { AuthController } from '../controllers/auth.controller';

export function createAuthController(): AuthController {
    const googleRepository = new GoogleRepositoryImpl();
    const facebookRepository = new FacebookRepositoryImpl();

    const jwtService = new JwtService();
    const googleService = new GoogleAppService(googleRepository, jwtService);
    const facebookService = new FacebookAppService(facebookRepository);
    
    const authService = new AuthService(googleService, facebookService);
    return new AuthController(authService);
}
