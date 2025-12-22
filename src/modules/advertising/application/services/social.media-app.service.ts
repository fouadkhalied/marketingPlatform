import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { FacebookPostInsights } from "../../../user/application/dtos/facebookDto/facebookInsights.dto";
import { FacebookPost } from "../../../user/application/dtos/facebookDto/facebookPost.dto";
import { FacebookPageService } from "../../../user/application/services/facebook-app.service";
import { autheticatedPage } from "../dto/authenticatedPage.dto";
import { ISocialMediaPageRepository } from "../../domain/repositories/social.media.page.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class SocialMediaAppService {
  constructor(
    private readonly socialMediaPageRepository: ISocialMediaPageRepository,
    private readonly facebookService: FacebookPageService,
    private readonly logger: ILogger
  ) {}

  // get all user autheticated pages (facebook , instagram , snapchat)
  async listPagesForUser(
    isActive: boolean,
    userId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<autheticatedPage[]>> {
    try {
      const pages = await this.socialMediaPageRepository.getAllPagesForUser(isActive, userId, pagination);
      return ResponseBuilder.paginatedSuccess(pages.data, pages.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }


  async listPostsFromPageForUser(
    userId: string,
    pageId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<FacebookPost[]>> {
    try {

      const pageAccessToken = await this.socialMediaPageRepository.getPageAccessTokenById(userId,pageId);
      if (!pageAccessToken) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR, "failed to retirve page access token for page id"
        )
      }

      const pages = await this.facebookService.getPagePosts(userId,pageId,pageAccessToken,{limit: pagination.limit});

      return ResponseBuilder.facebookPaginatedSuccess(pages.posts, pages.paging);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while retriving post from page",
        error instanceof Error ? error.message : error
      );
    }
  }


  async getPostInsights(
    userId: string,
    pageId: string,
    postIdOnPlatform: string
  ): Promise<ApiResponseInterface<FacebookPostInsights>> {
    try {
      // Get the page access token using the correct pageId
      const pageAccessToken = await this.socialMediaPageRepository.getPageAccessTokenById(userId, pageId);
      if (!pageAccessToken) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to retrieve page access token for page id"
        );
      }


      // Call the Facebook service with correct parameters
      const insights = await this.facebookService.getPostInsights(
        userId,           // userId for logging
        postIdOnPlatform, // post id
        pageAccessToken   // The page access token
      );

      return ResponseBuilder.success(insights);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while retrieving post insights",
        error instanceof Error ? error.message : error
      );
    }
  }
}
