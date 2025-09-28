export interface FacebookPaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    paging?: {
      next?: string;
      previous?: string;
    };
  }