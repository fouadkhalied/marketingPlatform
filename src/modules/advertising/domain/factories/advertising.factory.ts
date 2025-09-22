import { Advertising } from "../entities/advertising.entity";
import { randomUUID } from "crypto";

export class AdvertisingFactory {
  static create(
    title: string,
    description: string,
    budget: number,
    startDate: Date,
    endDate: Date
  ): Advertising {
    return new Advertising(randomUUID(), title, description, budget, startDate, endDate);
  }
}
