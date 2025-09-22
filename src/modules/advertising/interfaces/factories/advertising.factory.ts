import { AdvertisingController } from "../controllers/advertising.controller";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { AdvertisingRepository } from "../../infrastructure/repositories/advertising.repository";

export function createAdvertisingController(): AdvertisingController {
    const advertisingRepo = new AdvertisingRepository();
    const advertisingService = new AdvertisingAppService(advertisingRepo);
    const advertisingController = new AdvertisingController(advertisingService);

    return advertisingController;
}
