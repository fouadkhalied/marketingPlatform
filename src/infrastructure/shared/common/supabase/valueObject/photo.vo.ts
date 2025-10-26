import { PhotosInterface } from "../interfaces/photo.interface";

export class Photo {
  private maxPhotos: number = 5;
  private maxFileSize: number = 1 * 1024 * 1024; // 1 MB
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private readonly files: Express.Multer.File[],
  ) {

    this.validateCount();
    this.validateSize();
    this.validateType();
  }

  private validateCount() {
    if (this.files.length > this.maxPhotos) {
      throw new Error(`Maximum of ${this.maxPhotos} photo allowed per upload.`);
    }
  }

  private validateSize() {
    const oversized = this.files.filter(file => file.size > this.maxFileSize);
    if (oversized.length > 0) {
      throw new Error(`Each photo must be less than ${this.maxFileSize / 1024 / 1024}MB.`);
    }
  }

  private validateType() {
    const invalidFiles = this.files.filter(file => !this.allowedMimeTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      throw new Error(`Only JPEG, PNG, and WebP formats are allowed.`);
    }
  }

  private generateFilename(fileExtension: string): string {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return `ad-${uniqueSuffix}.${fileExtension}`;
  }

  public prepareForUpload(): PhotosInterface[] {
    const files = this.files; 
    return files.map((file: Express.Multer.File) => {
      const extension = file.originalname.split('.').pop();
      const filename = this.generateFilename(extension!);
      return {
        fileName: filename,
        isMain: true,
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size
      };
    });
  }
}
