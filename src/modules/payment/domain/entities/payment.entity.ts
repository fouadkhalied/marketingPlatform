export class Payment {
    constructor(
        public userId: string,
        public amount: number,
        public currency: string,
        public method: string,
        public id?: string,
        public createdAt?: Date
    ) {
        this.createdAt = this.createdAt || new Date();
    }
}
