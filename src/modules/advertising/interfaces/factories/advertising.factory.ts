import { AdvertisingController } from "../controllers/advertising.controller";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { AdvertisingRepository } from "../../infrastructure/repositories/advertising.repository";
import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { FacebookPageRepositoryImpl } from "../../../user/infrastructure/repositories/facebook.repository.impl";

export function createAdvertisingController(): AdvertisingController {
    const advertisingRepo = new AdvertisingRepository();
    const facebookRepo = new FacebookPageRepositoryImpl();
    const facebookService = new FacebookPageService(facebookRepo);

    const advertisingService = new AdvertisingAppService(advertisingRepo, facebookService);
    const advertisingController = new AdvertisingController(advertisingService);

    return advertisingController;
}
