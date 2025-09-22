import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { Advertising } from "../../domain/entities/advertising.entity";

export class AdvertisingRepository implements IAdvertisingRepository {
  private ads: Advertising[] = [];

  async save(ad: Advertising): Promise<void> {
    this.ads.push(ad);
  }

  async findById(id: string): Promise<Advertising | null> {
    return this.ads.find((ad) => ad.id === id) || null;
  }

  async findAll(): Promise<Advertising[]> {
    return this.ads;
  }
}
