import { eq } from "drizzle-orm";
import { Advertising } from "../../domain/entities/advertising.entity";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, ads, CreateAdData, InsertAd } from "../../../../infrastructure/shared/schema/schema";

export class AdvertisingRepository implements IAdvertisingRepository {
    async create(ad: InsertAd): Promise<InsertAd> {
        const [result] = await db.insert(ads).values(ad).returning();
        return result as unknown as Ad;
    }

    async findById(id: string): Promise<Ad | null> {
        const [result] = await db.select().from(ads).where(eq(ads.id, id));
        return result as unknown as Ad ?? null;
    }

    async findAll(): Promise<Ad[]> {
        return await db.select().from(ads) as unknown as Ad[];
    }

    async update(id: string, ad: Partial<Ad>): Promise<Ad | null> {
        const [result] = await db.update(ads).set(ad).where(eq(ads.id, id)).returning();
        return result as unknown as Ad ?? null;
    }

    async delete(id: string): Promise<void> {
        await db.delete(ads).where(eq(ads.id, id));
    }
}
