import { Advertising } from "../../domain/entities/advertising.entity";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { AdvertisingFactory } from "../../domain/factories/advertising.factory";

export class AdvertisingAppService {
  constructor(private readonly repo: IAdvertisingRepository) {}

  async createAd(
    title: string,
    description: string,
    budget: number,
    startDate: Date,
    endDate: Date
  ): Promise<Advertising> {
    const ad = AdvertisingFactory.create(title, description, budget, startDate, endDate);
    await this.repo.save(ad);
    return ad;
  }

  async getAllAds(): Promise<Advertising[]> {
    return this.repo.findAll();
  }
}
