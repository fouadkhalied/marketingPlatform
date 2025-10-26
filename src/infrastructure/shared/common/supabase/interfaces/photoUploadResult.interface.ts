export interface PhotoUploadResult<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    url: string[];
}
