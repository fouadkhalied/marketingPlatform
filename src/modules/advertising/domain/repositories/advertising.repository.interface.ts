import { Advertising } from "../entities/advertising.entity";

export interface IAdvertisingRepository {
    create(ad: Advertising): Promise<Advertising>;
    findById(id: string): Promise<Advertising | null>;
    findAll(): Promise<Advertising[]>;
    update(id: string, ad: Partial<Advertising>): Promise<Advertising | null>;
    delete(id: string): Promise<void>;
}
