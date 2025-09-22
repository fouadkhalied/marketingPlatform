export interface PaginationParams {
    page: number;
    limit: number;
  }
  
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      currentPage: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
}