import { Request } from "express";
import { userRoleEnum } from "../../../schema/schema";


declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: typeof userRoleEnum.enumValues[number];
      };
    }
  }
}