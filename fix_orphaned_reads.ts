import { db } from "./src/infrastructure/db/connection";
import { sql } from "drizzle-orm";

async function fix() {
    try {
        console.log("🔍 Checking for orphaned reads...");

        // Delete orphan records using raw SQL for reliability
        const result = await db.execute(sql`
      DELETE FROM user_admin_notification_reads 
      WHERE admin_notification_id NOT IN (SELECT id FROM admin_notifications)
    `);

        console.log("✅ Cleanup complete. Deleted orphaned rows:", result.rowCount);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error running cleanup:", err);
        process.exit(1);
    }
}

fix();
