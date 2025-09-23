import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { Advertising } from "../entities/advertising.entity";

export interface IAdvertisingRepository {
    create(ad: InsertAd): Promise<InsertAd>;
    findById(id: string): Promise<Ad | null>;
    findAll(): Promise<Ad[]>;
    update(id: string, ad: Partial<Ad>): Promise<Ad | null>;
    delete(id: string): Promise<void>;
}
