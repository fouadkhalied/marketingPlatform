export abstract class BasePixelCodeGenerator {
    constructor(protected pixelId: string) {}
    
    abstract generateCode(): string;
    abstract getPlatform(): string;
  }