import { ErrorCode } from "../enums/basic.error.enum";

export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  // Validation Errors (400)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_ID]: 400,
     
  // Authentication & Authorization Errors
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.UNAUTHORIZED_ACCESS]: 403,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.AUTO_LOGIN_FAILED]: 401,
  [ErrorCode.INVALID_PASSWORD]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.INSUFFICIENT_BALANCE]:402,
     
  // Resource Not Found Errors (404)
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.AD_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.BAD_REQUEST]: 404,
  [ErrorCode.TOO_MANY_REQUESTS]: 404,
     
  // User-specific Errors
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_NOT_VERIFIED]: 403,
  [ErrorCode.USER_ALREADY_VERIFIED]: 400,
     
  // OTP-specific Errors
  [ErrorCode.INVALID_OTP]: 400,
  [ErrorCode.OTP_EXPIRED]: 400,
  [ErrorCode.OTP_SEND_FAILED]: 503,
  [ErrorCode.OTP_VERIFICATION_FAILED]: 400,
     
  // Conflict Errors (409)
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.CONFLICT]: 409,
     
  // Client Request Errors
  [ErrorCode.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_MEDIA_TYPE]: 415,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
     
  // Server & Database Errors (500)
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.TIMEOUT_ERROR]: 504,
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.FAILED_TO_SEND_EMAIL]: 503,
     
  // General Errors
  [ErrorCode.UNKNOWN_ERROR]: 500
};