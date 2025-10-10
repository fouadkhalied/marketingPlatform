export interface FacebookPost {
    id: string;
    message?: string;
    story?: string;
    created_time: string;
    updated_time?: string;
    type: string;
    status_type?: string;
    permalink_url?: string;
    full_picture?: string;
    attachments?: {
      data: Array<{
        type: string;
        url?: string;
        media?: {
          image: {
            src: string;
          };
        };
      }>;
    };
  }