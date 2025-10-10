export interface ApiResponseInterface<T> {
    success: boolean;
    message:string;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }
  
