// factories/notification.factory.ts

import { createLogger, ILogger } from "../../../common/logging";
import { EmailNotificationChannel } from "../../channels/email.channel";
import { SSENotificationChannel } from "../../channels/SSE.channel";
import { NotificationRepositoryImpl } from "../../repositories/notification.repository.impl";
import { INotificationRepository } from "../../repositories/notification.repository.interface";
import { NotificationAppService } from "../../service/notification.app.service";
import { NotificationService } from "../../service/notification.servcie";
import { NotificationController } from "../controller/notification.controller";

export interface NotificationFactoryConfig {
  notificationRepo?: INotificationRepository;
  enableSSE?: boolean;
  enableDatabase?: boolean;
  enableEmail?: boolean;
}

export interface NotificationFactoryResult {
  notificationService: NotificationService;
  notificationAppService: NotificationAppService;
  sseChannel?: SSENotificationChannel;
  notificationController: NotificationController;
  logger: ILogger;
}

/**
 * Factory function to create NotificationService with all configured channels
 */
export function createNotificationFactory(): NotificationFactoryResult {
  const logger = createLogger('notification');

  // Create repository 
  const repo = new NotificationRepositoryImpl();

  // Create core notification service
  const notificationService = new NotificationService(logger, repo);
  
  // Create app service
  const notificationAppService = new NotificationAppService(
    repo,
    notificationService,
    logger
  );

  let sseChannel: SSENotificationChannel | undefined;

  // Register SSE Channel (for real-time notifications)
    sseChannel = new SSENotificationChannel(repo);
    notificationService.registerChannel(sseChannel);
    logger.info("SSE notification channel registered");

  // Register Email Channel (for email notifications)
    const emailChannel = new EmailNotificationChannel();
    notificationService.registerChannel(emailChannel);
    logger.info("Email notification channel registered");

  console.log("✅ NotificationService factory created:", {
    hasNotificationService: !!notificationService,
    hasNotificationAppService: !!notificationAppService,
    hasSseChannel: !!sseChannel,
    serviceType: notificationService?.constructor?.name,
    appServiceType: notificationAppService?.constructor?.name
  });

  // create notificatoin controller
  const notificationController = new NotificationController(notificationAppService)

  return {
    notificationService,
    notificationAppService,
    sseChannel,
    notificationController,
    logger,
  };
}
