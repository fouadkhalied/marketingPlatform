import { FacebookPage } from "./facebookPage.dto";

export interface FacebookPagesResponse {
    data: FacebookPage[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
    };
  }