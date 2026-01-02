import { NotificationModule } from "../enum/notification.module.enum";
import { NotificationType } from "../enum/notification.type.enum";
import { NotificationPayload } from "../interfaces/notification.payload.interface";

export class NotificationBuilder {
    private payload: Partial<NotificationPayload> = {
      timestamp: new Date(),
      metadata: {},
    };
  
    setUserId(userId: string): this {
      this.payload.userId = userId;
      return this;
    }
  
    setModule(module: NotificationModule): this {
      this.payload.module = module;
      return this;
    }
  
    setType(type: NotificationType): this {
      this.payload.type = type;
      return this;
    }
  
    setTitle(title: {en: string, ar: string}): this {
      this.payload.title = title;
      return this;
    }

    setMessage(message: {en: string, ar: string}): this {
      this.payload.message = message;
      return this;
    }
  
    addMetadata(key: string, value: any): this {
      this.payload.metadata = this.payload.metadata || {};
      this.payload.metadata[key] = value;
      return this;
    }
  
    setMetadata(metadata: Record<string, any>): this {
      this.payload.metadata = metadata;
      return this;
    }
  
    build(): NotificationPayload {
      if (!this.payload.userId || !this.payload.module || !this.payload.type || 
          !this.payload.title || !this.payload.message) {
        throw new Error("Missing required notification fields");
      }
      this.payload.read = false;
      this.payload.fromDatabase = false;
      return this.payload as NotificationPayload;
    }
  }