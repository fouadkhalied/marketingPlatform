import { AdvertisingController } from "../controllers/advertising.controller";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { AdvertisingRepository } from "../../infrastructure/repositories/advertising.repository";
import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { FacebookPageRepositoryImpl } from "../../../user/infrastructure/repositories/facebook.repository.impl";
import { UploadPhoto } from "../../../../infrastructure/shared/common/supabase/module/supabase.module";
import { SupabaseUploader } from "../../../../infrastructure/shared/common/supabase/module/supabaseUploader.module";

export function createAdvertisingController(): AdvertisingController {
    const advertisingRepo = new AdvertisingRepository();
    const facebookRepo = new FacebookPageRepositoryImpl();
    const facebookService = new FacebookPageService(facebookRepo);

    const supabaseUploader = new SupabaseUploader()
    const photoUploader = new UploadPhoto(supabaseUploader);

    const advertisingService = new AdvertisingAppService(advertisingRepo, facebookService, photoUploader);
    const advertisingController = new AdvertisingController(advertisingService);

    return advertisingController;
}
