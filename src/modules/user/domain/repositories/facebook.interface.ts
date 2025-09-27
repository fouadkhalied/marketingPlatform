export interface FacebookPageRepository {
    savePageAccessToken(userId: string, pageId: string, accessToken: string, pageName: string): Promise<void>;
    logApiUsage(userId: string, endpoint: string, timestamp: Date): Promise<void>;
}