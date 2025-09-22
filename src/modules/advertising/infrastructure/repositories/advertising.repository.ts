import { db } from "@/lib/db"; // adjust path based on your project
import { ads } from "@/lib/schema"; // drizzle schema
import { eq } from "drizzle-orm";
import { Advertising } from "../../domain/entities/advertising.entity";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";

export class AdvertisingRepository implements IAdvertisingRepository {
    async create(ad: Advertising): Promise<Advertising> {
        const [result] = await db.insert(ads).values(ad).returning();
        return result as unknown as Advertising;
    }

    async findById(id: string): Promise<Advertising | null> {
        const [result] = await db.select().from(ads).where(eq(ads.id, id));
        return result as unknown as Advertising ?? null;
    }

    async findAll(): Promise<Advertising[]> {
        return await db.select().from(ads) as unknown as Advertising[];
    }

    async update(id: string, ad: Partial<Advertising>): Promise<Advertising | null> {
        const [result] = await db.update(ads).set(ad).where(eq(ads.id, id)).returning();
        return result as unknown as Advertising ?? null;
    }

    async delete(id: string): Promise<void> {
        await db.delete(ads).where(eq(ads.id, id));
    }
}
