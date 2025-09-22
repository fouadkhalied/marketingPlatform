import { Request, Response } from "express";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";

export class AdvertisingController {
    constructor(private readonly advertisingService: AdvertisingAppService) {}

    async createAd(req: Request, res: Response): Promise<void> {
        try {
            const ad = await this.advertisingService.createAd(req.body);
            res.status(201).json(ad);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
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
