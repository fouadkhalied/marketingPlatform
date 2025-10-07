import { Request, Response } from "express";
import { newPaymentDto, CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { InsertPurchase } from "../../../../infrastructure/shared/schema/schema";
import { paymobConfig } from "../../../../infrastructure/config/paymob.config";
import { PaymobPaymentHandler } from "../../../../infrastructure/shared/paymob/paymob";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";

export class PaymentService {
    private readonly paymobHandler: PaymobPaymentHandler;

    constructor(private readonly paymentRepo: PaymentRepository) {
        this.paymobHandler = new PaymobPaymentHandler(paymobConfig);
        this.setupWebhookHandlers();
    }

    async createCheckoutSession(
        req: Request,
        res: Response
    ): Promise<ApiResponseInterface<{ url: string; sessionId: string }>> {
        try {
            const paymentDto: newPaymentDto = req.body;
            const userId = req.user!.id.toString();

            const session = await this.paymobHandler.createCheckoutSession({
                amount: paymentDto.amount,
                currency: paymentDto.currency,
                customerEmail: req.user!.email,
                metadata: { userId },
            });

            if (!session.url) {
                return ErrorBuilder.build(
                    ErrorCode.EXTERNAL_SERVICE_ERROR,
                    "Failed to create Paymob session."
                );
            }

            // Save pending payment
            const pendingPaymentData: InsertPurchase = {
                userId,
                amount: paymentDto.amount.toString(),
                currency: paymentDto.currency,
                method: "paymob",
                status: "pending",
                stripeSessionId: session.id, // reused column name
            };

            await this.paymentRepo.save(pendingPaymentData);

            return ResponseBuilder.success({
                url: session.url,
                sessionId: session.id,
            });
        } catch (error:any) {
            console.error("❌ Paymob createCheckoutSession error:", error);
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createCompletedPayment(dto: CreatePaymentDto): Promise<void> {
        try {
            const paymentData: InsertPurchase = {
                userId: dto.userId,
                amount: dto.amount.toString(),
                currency: dto.currency,
                method: "paymob",
                status: "completed",
                stripeSessionId: dto.stripeSessionId,
            };

            await this.paymentRepo.save(paymentData);

            console.log("✅ Paymob payment completed:", {
                userId: dto.userId,
                amount: dto.amount,
            });
        } catch (error) {
            console.error("❌ Error creating completed payment:", error);
            throw new Error(
                `Failed to process payment: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    private setupWebhookHandlers(): void {
        console.log("🔧 Setting up Paymob webhook handlers...");

        this.paymobHandler.onWebhookEvent(
            "checkout.session.completed",
            async (event) => {
                console.log("🎯 Paymob payment completed!");
                await this.handleCheckoutCompleted(event.data.object);
            }
        );

        this.paymobHandler.onWebhookEvent(
            "payment_intent.payment_failed",
            async (event) => {
                console.log("❌ Paymob payment failed!");
                await this.handlePaymentFailed(event.data.object);
            }
        );

        console.log(
            "✅ Paymob Webhook handlers registered:",
            Array.from(this.paymobHandler["webhookHandlers"].keys())
        );
    }

    async handleCheckoutCompleted(sessionData: any): Promise<void> {
        try {
            const userId = sessionData.metadata?.userId;
            if (!userId) throw new Error("Missing userId in metadata");

            const existing = await this.paymentRepo.findBySessionId(
                sessionData.id
            );
            if (existing && existing.status === "completed") {
                console.log("⚠️ Already processed, skipping:", sessionData.id);
                return;
            }

            const dto: CreatePaymentDto = {
                userId,
                amount: sessionData.amount_total / 100,
                currency: sessionData.currency,
                method: "paymob",
                stripeSessionId: sessionData.id,
            };

            await this.createCompletedPayment(dto);
        } catch (error) {
            console.error("❌ Error in Paymob handleCheckoutCompleted:", error);
            throw error;
        }
    }

    async handlePaymentFailed(sessionData: any): Promise<void> {
        try {
            const sessionId = sessionData.id;
            if (sessionId) {
                await this.paymentRepo.updateStatus(sessionId, "failed");
                console.log("❌ Payment marked as failed:", sessionId);
            }
        } catch (error) {
            console.error("❌ Error handling Paymob failure:", error);
        }
    }

    async processWebhook(payload: any): Promise<void> {
        try {
            await this.paymobHandler.processWebhook(payload);
        } catch (error) {
            console.error("❌ Paymob webhook error:", error);
            throw error;
        }
    }

    async getPaymentStatus(sessionId: string) {
        try {
            return await this.paymentRepo.findBySessionId(sessionId);
        } catch (error) {
            console.error("❌ Error getting Paymob payment status:", error);
            return null;
        }
    }

    async getPurchaseHistory(userId: string, page = 1, limit = 10) {
        try {
            const result = await this.paymentRepo.getPurchaseHistory(
                { userId },
                { page, limit, sortBy: "createdAt", sortOrder: "desc" }
            );
            return ResponseBuilder.success(result);
        } catch (error) {
            console.error("❌ Error getting purchase history:", error);
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Failed to fetch purchase history"
            );
        }
    }

    async getPurchaseHistoryForAdmin(page = 1, limit = 10) {
        try {
            const result = await this.paymentRepo.getPurchaseHistoryForAdmin({
                page,
                limit,
                sortBy: "createdAt",
                sortOrder: "desc",
            });
            return ResponseBuilder.success(result);
        } catch (error) {
            console.error("❌ Error getting admin purchase history:", error);
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Failed to fetch admin purchase history"
            );
        }
    }
}
