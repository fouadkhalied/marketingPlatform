import { PaymobPaymentHandler } from "../shared/paymob/paymob";
import { PaymobConfig } from "../shared/paymob/paymob.interface";
import { appConfig } from "./app.config";

export const paymobConfig: PaymobConfig = {
    apiKey: appConfig.PAYMOB_API_KEY,
    integrationId: Number(appConfig.PAYMOB_INTEGRATION_ID),
    iframeId:  undefined,
    hmacSecret: appConfig.PAYMOB_HMAC_SECRET,
    publicKey: appConfig.PAYMOB_PUBLIC_KEY,
    defaultCurrency: process.env.PAYMOB_DEFAULT_CURRENCY || "EGP",
    successUrl: appConfig.PAYMOB_SUCCESS_URL,
    cancelUrl: appConfig.PAYMOB_CANCEL_URL,
  };

const paymob = new PaymobPaymentHandler(paymobConfig);