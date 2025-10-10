export class Advertising {
    constructor(
        public id: string,
        public userId: string,
        public titleEn: string,
        public titleAr: string,
        public descriptionEn: string,
        public descriptionAr: string,
        public targetUrl: string,
        public imageUrl?: string,
        public status: string = "draft",
        public targetAudience?: string,
        public budgetType?: string,
        public createdAt?: Date,
        public updatedAt?: Date,
    ) {}
}
