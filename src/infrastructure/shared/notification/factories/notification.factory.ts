import { NotificationService } from "../service/notification.servcie";
import { SSENotificationChannel } from "../channels/SSE.channel";
import { EmailNotificationChannel } from "../channels/email.channel";
import { createLogger, ILogger } from "../../common/logging";
import { NotificationRepositoryImpl } from "../repositories/notification.repository.impl";
import { INotificationRepository } from "../repositories/notification.repository.interface";

export interface NotificationFactoryConfig {
  notificationRepo?: INotificationRepository; // Repository for database channel
  enableSSE?: boolean;
  enableDatabase?: boolean;
  enableEmail?: boolean;
}

export interface NotificationFactoryResult {
  notificationService: NotificationService;
  sseChannel?: SSENotificationChannel;
}

/**
 * Factory function to create NotificationService with all configured channels
 */
export function createNotificationService(
  config: NotificationFactoryConfig
): NotificationFactoryResult {
  const logger = createLogger('notification');
  const { notificationRepo, enableSSE = true, enableDatabase = true, enableEmail = false } = config;

  // Create repository if not provided
  const repo = notificationRepo || new NotificationRepositoryImpl();

  const notificationService = new NotificationService(logger, repo);
  let sseChannel: SSENotificationChannel | undefined;

  // Register SSE Channel (for real-time notifications)
  if (enableSSE) {
    sseChannel = new SSENotificationChannel(repo);
    notificationService.registerChannel(sseChannel);
    logger.info("SSE notification channel registered");
  }

  // Note: Database saving is handled directly in NotificationService
  // DatabaseNotificationChannel is not needed anymore

  // Register Email Channel (for email notifications)
  if (enableEmail) {
    const emailChannel = new EmailNotificationChannel();
    notificationService.registerChannel(emailChannel);
    logger.info("Email notification channel registered");
  }

  return {
    notificationService,
    sseChannel,
  };
}

/**
 * Factory function to create NotificationService with default configuration
 */
export function createDefaultNotificationService(
  notificationRepo?: any
): NotificationFactoryResult {
  return createNotificationService({
    notificationRepo,
    enableSSE: true,
    enableDatabase: true,
    enableEmail: false,
  });
}

