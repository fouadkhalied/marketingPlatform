import { createInsertSchema } from "drizzle-zod";
import { users } from "../../../../infrastructure/shared/schema/schema";

export const CreateUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    freeViewsCredits: true,
    stripeCustomerId: true,
});