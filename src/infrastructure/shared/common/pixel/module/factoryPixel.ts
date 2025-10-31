import { BasePixelCodeGenerator } from "../interface/basePixelGenerator.interface";
import {
    FacebookPixelCodeGenerator,
    InstagramPixelCodeGenerator,
    TikTokPixelCodeGenerator,
    SnapchatPixelCodeGenerator,
    GoogleAdsPixelCodeGenerator,
    PinterestPixelCodeGenerator,
    LinkedInPixelCodeGenerator,
    TwitterPixelCodeGenerator,
    RedditPixelCodeGenerator,
    QuoraPixelCodeGenerator,
    BingPixelCodeGenerator,
    YouTubePixelCodeGenerator,
    ShopifyPixelCodeGenerator
  } from "./pixels.modules";
  
 // Factory to create appropriate pixel generator
 export class PixelCodeGeneratorFactory {
    static create(platform: string, pixelId: string): BasePixelCodeGenerator {
      switch (platform.toLowerCase()) {
        case "facebook":
          return new FacebookPixelCodeGenerator(pixelId);
        case "instagram":
          return new InstagramPixelCodeGenerator(pixelId);
        case "tiktok":
          return new TikTokPixelCodeGenerator(pixelId);
        case "snapchat":
          return new SnapchatPixelCodeGenerator(pixelId);
        case "google_ads":
          return new GoogleAdsPixelCodeGenerator(pixelId);
        case "pinterest":
          return new PinterestPixelCodeGenerator(pixelId);
        case "linkedin":
          return new LinkedInPixelCodeGenerator(pixelId);
        case "twitter":
          return new TwitterPixelCodeGenerator(pixelId);
        case "reddit":
          return new RedditPixelCodeGenerator(pixelId);
        case "quora":
          return new QuoraPixelCodeGenerator(pixelId);
        case "bing":
          return new BingPixelCodeGenerator(pixelId);
        case "youtube":
          return new YouTubePixelCodeGenerator(pixelId);
        case "shopify":
          return new ShopifyPixelCodeGenerator(pixelId);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    }
  }