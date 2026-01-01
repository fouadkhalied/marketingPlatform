import { NotificationType } from "../enum/notification.type.enum";

export interface LocalizedMessage {
  en: string;
  ar: string;
}

export interface NotificationMessage {
  title: LocalizedMessage;
  message: LocalizedMessage;
}

export const NotificationMessages: Record<NotificationType, NotificationMessage> = {
  // Ad notifications
  [NotificationType.AD_APPROVED]: {
    title: {
      en: "Ad Approved",
      ar: "تمت الموافقة على الإعلان"
    },
    message: {
      en: "Your advertisement has been approved",
      ar: "تمت مراجعة اعلانك وتمت الموافقة عليه"
    }
  },
  [NotificationType.AD_REJECTED]: {
    title: {
      en: "Ad Rejected",
      ar: "تم رفض الإعلان"
    },
    message: {
      en: "Your advertisement has been rejected",
      ar: "تم رفض إعلانك"
    }
  },
  [NotificationType.AD_ACTIVATED]: {
    title: {
      en: "Ad Activated",
      ar: "تم تفعيل الإعلان"
    },
    message: {
      en: "Your advertisement has been activated",
      ar: "تم تفعيل إعلانك"
    }
  },
  [NotificationType.AD_DEACTIVATED]: {
    title: {
      en: "Ad Deactivated",
      ar: "تم إلغاء تفعيل الإعلان"
    },
    message: {
      en: "Your advertisement has been deactivated",
      ar: "تم إلغاء تفعيل إعلانك"
    }
  },
  
  // Payment notifications
  [NotificationType.PAYMENT_SUCCESS]: {
    title: {
      en: "Payment Successful",
      ar: "تم الدفع بنجاح"
    },
    message: {
      en: "Your payment has been processed successfully",
      ar: "تم معالجة دفعتك بنجاح"
    }
  },
  [NotificationType.PAYMENT_FAILED]: {
    title: {
      en: "Payment Failed",
      ar: "فشل الدفع"
    },
    message: {
      en: "Your payment has failed. Please try again",
      ar: "فشلت عملية الدفع. يرجى المحاولة مرة أخرى"
    }
  },
  [NotificationType.PAYMENT_PENDING]: {
    title: {
      en: "Payment Pending",
      ar: "الدفع قيد الانتظار"
    },
    message: {
      en: "Your payment is being processed",
      ar: "جاري معالجة دفعتك"
    }
  },
  [NotificationType.PAYMENT_REFUNDED]: {
    title: {
      en: "Payment Refunded",
      ar: "تم استرداد الدفع"
    },
    message: {
      en: "Your payment has been refunded",
      ar: "تم استرداد دفعتك"
    }
  },
  
  // Credit notifications
  [NotificationType.CREDIT_ADDED]: {
    title: {
      en: "Credit Added",
      ar: "تم إضافة الرصيد"
    },
    message: {
      en: "Credit has been added to your account",
      ar: "تم إضافة رصيد إلى حسابك"
    }
  },
  [NotificationType.CREDIT_DEDUCTED]: {
    title: {
      en: "Credit Deducted",
      ar: "تم خصم الرصيد"
    },
    message: {
      en: "Credit has been deducted from your account",
      ar: "تم خصم رصيد من حسابك"
    }
  },
  [NotificationType.CREDIT_LOW_BALANCE]: {
    title: {
      en: "Low Balance",
      ar: "رصيد منخفض"
    },
    message: {
      en: "Your account balance is running low",
      ar: "رصيد حسابك منخفض"
    }
  }
};

