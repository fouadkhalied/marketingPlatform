import { Request, Response } from "express";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { CreateAdData, createAdSchema, InsertAd } from "../../../../infrastructure/shared/schema/schema";

export class AdvertisingController {
    constructor(private readonly advertisingService: AdvertisingAppService) {}

    
async createAd(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: "User not authenticated" });
            return;
          }
        
        const adData =  {
            ...req.body,
            userId: req.user.id
          };

      const validation = createAdSchema.safeParse(adData);
  
      if (!validation.success) {
        res.status(400).json({ error: "Validation failed", details: validation.error.errors });
        return;
      }      
      
      const createdAd = await this.advertisingService.createAd(validation.data);
  
      res.status(201).json({
        message: "Ad created successfully",
        createdAd
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ad", message: error.message });
    }
  }
      
    

    async getAd(req: Request, res: Response): Promise<void> {
        try {
            const ad = await this.advertisingService.getAdById(req.params.id);
            if (!ad) {
                res.status(404).json({ message: "Ad not found" });
                return;
            }
            res.json(ad);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    async listAds(req: Request, res: Response): Promise<void> {
        const ads = await this.advertisingService.listAds();
        res.json(ads);
    }

    async updateAd(req: Request, res: Response): Promise<void> {
        try {
            const ad = await this.advertisingService.updateAd(req.params.id, req.body);
            if (!ad) {
                res.status(404).json({ message: "Ad not found" });
                return;
            }
            res.json(ad);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    async deleteAd(req: Request, res: Response): Promise<void> {
        try {
            await this.advertisingService.deleteAd(req.params.id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
