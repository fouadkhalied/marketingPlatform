import { Request, Response } from "express";
import { AdvertisingAppService } from "../../application/services/advertising-app.service";
import { AdvertisingRepository } from "../../infrastructure/repositories/advertising.repository";

const repo = new AdvertisingRepository();
const service = new AdvertisingAppService(repo);

export class AdvertisingController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, budget, startDate, endDate } = req.body;
      const ad = await service.createAd(
        title,
        description,
        budget,
        new Date(startDate),
        new Date(endDate)
      );
      res.status(201).json(ad);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const ads = await service.getAllAds();
    res.json(ads);
  }
}
