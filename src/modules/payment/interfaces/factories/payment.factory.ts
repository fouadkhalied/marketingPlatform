import { PaymentController } from "../controllers/payment.controller";
import { PaymentService } from "../../application/services/payment.service";
import { PaymentRepositoryImpl } from "../../infrastructure/repositories/payment.repository.impl";
import { WebhookService } from "../../application/services/webhook.service";

export function createPaymentController() : PaymentController {
    const paymentRepo = new PaymentRepositoryImpl();
    const paymentService = new PaymentService(paymentRepo);
    const paymentController = new PaymentController(paymentService);

    return paymentController;
}
