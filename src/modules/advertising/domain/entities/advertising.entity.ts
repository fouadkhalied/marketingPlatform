export class Advertising {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public budget: number,
    public startDate: Date,
    public endDate: Date
  ) {}

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  increaseBudget(amount: number): void {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }
    this.budget += amount;
  }
}
