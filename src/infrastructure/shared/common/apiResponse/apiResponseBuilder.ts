import { PaginatedResponse } from "../pagination.vo";
import { ApiResponseInterface } from "./interfaces/apiResponse.interface";
import { FacebookPaginatedResponse } from "./interfaces/facebookPaginatedResponse.interface";

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

static facebookPaginatedSuccess<T>(
  data: T[],
  paging?: { next?: string; previous?: string },
  message = "Request successful"
): ApiResponseInterface<T[]> & { paging?: { next?: string; previous?: string } } {
  return {
    success: true,
    message,
    data,
    paging
  };
}

}
