import { Advertising } from "../../domain/entities/advertising.entity";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";

export class AdvertisingAppService {
    constructor(private readonly advertisingRepository: IAdvertisingRepository) {}

    async createAd(ad: Advertising): Promise<Advertising> {
        return await this.advertisingRepository.create(ad);
    }

    async getAdById(id: string): Promise<Advertising | null> {
        return await this.advertisingRepository.findById(id);
    }

    async listAds(): Promise<Advertising[]> {
        return await this.advertisingRepository.findAll();
    }

    async updateAd(id: string, ad: Partial<Advertising>): Promise<Advertising | null> {
        return await this.advertisingRepository.update(id, ad);
    }

    async deleteAd(id: string): Promise<void> {
        return await this.advertisingRepository.delete(id);
    }
}
