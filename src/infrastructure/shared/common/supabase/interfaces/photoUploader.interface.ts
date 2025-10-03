import { PhotosInterface } from "./photo.interface";

export interface IUploader {
    upload(file: PhotosInterface): Promise<boolean>;
    getUrl(filePath : string) : Promise<string>;
}
  