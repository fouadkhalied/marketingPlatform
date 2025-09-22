import { PaginatedResponse } from "../pagination.vo";
import { ApiResponseInterface } from "./interfaces/apiResponse.interface";

export class ResponseBuilder {
  static success<T>(
    data: T,
    message = "Request successful"
  ): ApiResponseInterface<T> {
    return {
      success: true,
      message,
      data
    };
  }

  static fail<T>(
    data: T,
    message = "Request failed"
  ):ApiResponseInterface<T> {
    return {
      success: false,
      message,
      data
    };
  }

  static paginatedSuccess<T>(
    data: T[],
    pagination: PaginatedResponse<any>["pagination"],
    message = "Request successful"
  ): ApiResponseInterface<T[]> & { pagination: PaginatedResponse<any>["pagination"] } {
    return {
      success: true,
      message,
      data,
      pagination
    };
  }
}
