// infrastructure/storage/SupabaseUploader.ts

import { supabase, supabaseClient } from "../config/supbase.config";
import { PhotosInterface } from "../interfaces/photo.interface";
import { IUploader } from "../interfaces/photoUploader.interface";

export class SupabaseUploader implements IUploader {

  async upload(file: PhotosInterface): Promise<boolean> {

    try {
      const { error } = await supabaseClient.storage
      .from("photos")
      .upload(file.fileName, file.buffer, {
        contentType: file.mimeType,
      });

    if (error) {
      throw new Error("Upload failed: " + error.message);
    } else {
      return true
    }

    } catch (error:any) {

      throw new Error(`error in uploading photo : ${error.message}`);
    }
  }

  async getUrl(filePath : string) : Promise<string> {
    try {
      const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
    } catch (error:any) {
      throw new Error(`error in uploading photo : ${error.message}`);
    }
  }
}
