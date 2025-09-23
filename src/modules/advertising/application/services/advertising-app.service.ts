import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";

export class AdvertisingAppService {
    constructor(private readonly advertisingRepository: IAdvertisingRepository) {}

    async createAd(ad: InsertAd): Promise<InsertAd> {
  
        return await this.advertisingRepository.create(ad);
    }

    async getAdById(id: string): Promise<Ad | null> {
        return await this.advertisingRepository.findById(id);
    }

    async listAds(): Promise<Ad[]> {
        return await this.advertisingRepository.findAll();
    }

    async updateAd(id: string, ad: Partial<Ad>): Promise<Ad | null> {
        return await this.advertisingRepository.update(id, ad);
    }

    async deleteAd(id: string): Promise<void> {
        return await this.advertisingRepository.delete(id);
    }
}
