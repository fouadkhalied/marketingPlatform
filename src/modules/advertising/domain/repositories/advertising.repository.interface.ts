import { Advertising } from "../entities/advertising.entity";

export interface IAdvertisingRepository {
  save(ad: Advertising): Promise<void>;
  findById(id: string): Promise<Advertising | null>;
  findAll(): Promise<Advertising[]>;
}
