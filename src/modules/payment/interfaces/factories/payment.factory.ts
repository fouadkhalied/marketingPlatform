import { PaymentController } from "../controllers/payment.controller";
import { PaymentService } from "../../application/services/payment.service";
import { PaymentRepositoryImpl } from "../../infrastructure/repositories/payment.repository.impl";
import { WebhookService } from "../../application/services/webhook.service";
import { NotificationService } from "../../../../infrastructure/shared/notification/service/notification.servcie";
import { NotificationRepositoryImpl } from "../../../../infrastructure/shared/notification/repositories/notification.repository.impl";
import { createLogger } from "../../../../infrastructure/shared/common/logging";

export function createPaymentController() : PaymentController {
    const paymentRepo = new PaymentRepositoryImpl();

    const notificationRepo = new NotificationRepositoryImpl();
    const logger = createLogger();


    const notificationService = new NotificationService(logger, notificationRepo);
    const paymentService = new PaymentService(paymentRepo, notificationService);

    const paymentController = new PaymentController(paymentService);

    return paymentController;
}
