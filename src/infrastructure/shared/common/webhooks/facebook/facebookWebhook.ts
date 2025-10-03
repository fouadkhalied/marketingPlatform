import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../db/connection";
import { ads, AdUserEngagement, adUserEngagement } from "../../../schema/schema";


// ... imports remain the same

export class FacebookWebhook {

    // ---------- Verify webhook ----------
    private verifyWebhook(req: Request, res: Response) {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
    
      if (mode && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
      } else {
    res.sendStatus(403);
      }
    }
    
    // ---------- Handle webhook events ----------   
    private async handleWebhook(req: Request, res: Response) {
      const body = req.body;
    
      if (body.object === "page") {
    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        const { field, value } = change;
    
        // We handle reactions, comments, shares
        if (["reactions", "comments", "shares"].includes(field)) {
          // The reaction_type might be undefined for comments/shares, but that's fine
          const { post_id, user_id, reaction_type } = value; 
    
          // Find ad that matches this post
          const ad = await db
             .select({ id: ads.id })
             .from(ads)
             .where(eq(ads.postIdOnPlatform, post_id))
             .limit(1);
    
          if (ad.length === 0) {
             console.log(`Ignored ${field}: no matching ad for post ${post_id}`);
             continue;
          }
    
          const adId = ad[0].id;
          
          // Check if there is already a user engagement row
          const engagement = await db
             .select()
             .from(adUserEngagement)
             .where( // <- The .where() function was missing/misplaced here
               and(
                eq(adUserEngagement.adId, adId),
                eq(adUserEngagement.userId, user_id)
               )
             )
             .limit(1);
    
          if (engagement.length === 0) {
             // Insert new row
             await db.insert(adUserEngagement).values({
               adId: adId,
               userId: user_id,
               liked: field === "reactions" && reaction_type === "LIKE",
               commented: field === "comments",
               shared: field === "shares",
               // If it's a reaction, and NOT a LIKE, then include it in the reactions JSON column
               reactions: (field === "reactions" && reaction_type && reaction_type !== "LIKE")
                ? { [reaction_type]: true }
                : {}, // reaction_type will be undefined for comments/shares, so this is safe
             });
          } else {
             // Update existing row
             const updates: Partial<AdUserEngagement> = {};
             const currentEngagement = engagement[0]; // For easier access
             
             if (field === "reactions" && reaction_type === "LIKE") {
               updates.liked = true;
             }
             if (field === "comments") {
               updates.commented = true;
             }
             if (field === "shares") {
               updates.shared = true;
             }
             
             // Handle non-LIKE reactions
             if (field === "reactions" && reaction_type && reaction_type !== "LIKE") {
               updates.reactions = { 
                ...(currentEngagement.reactions as any || {}), 
                [reaction_type]: true 
               };
             }
                  
                  // Only update if there are changes to avoid unnecessary database writes
             if (Object.keys(updates).length > 0) {
               await db.update(adUserEngagement)
                .set(updates)
                .where(eq(adUserEngagement.id, currentEngagement.id));
             }
          }
    
          console.log(`Verified ${field} for user ${user_id} on post ${post_id}`);
        }
      }
    }
    
    res.sendStatus(200);
      } else {
    res.sendStatus(404);
      }
    }
    }