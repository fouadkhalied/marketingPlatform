import { eq } from "drizzle-orm";
import { userRoleEnum, users } from "../../../schema/schema";
import { NextFunction, Request, Response } from "express";
import { db } from "../../../../db/connection";
import jwt from 'jsonwebtoken';
import { ErrorBuilder } from "../../errors/errorBuilder";
import { ErrorCode } from "../../errors/enums/basic.error.enum";
import { ERROR_STATUS_MAP } from "../../errors/mapper/mapperErrorEnum";
import { JwtPayload } from "../interfaces/jwtPayload";
import { appConfig } from "../../../../config/app.config";

// Simple in-memory cache for user data
interface CacheEntry {
  data: {
    id: string;
    email: string;
    name: string;
    role: typeof userRoleEnum.enumValues[number];
    oauth: string;
  };
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to invalidate user cache (useful when user data is updated)
export const invalidateUserCache = (userId: string) => {
  userCache.delete(userId);
};

// Function to clear all cache (useful for maintenance)
export const clearUserCache = () => {
  userCache.clear();
};

// Role-based authentication middleware
export const AuthMiddleware = (allowedRole?: typeof userRoleEnum.enumValues[number]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          'Authentication token is required.'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.UNAUTHORIZED]).json(errorResponse);
      }

      // 2. Verify JWT token
      const jwtSecret = appConfig.JWT_SECRET;
      if (!jwtSecret) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.INTERNAL_SERVER_ERROR,
          'JWT configuration error'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.INTERNAL_SERVER_ERROR]).json(errorResponse);
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      let userData;

      // 3. For normal users, fetch from cache or DB
      if (!decoded.oauth || decoded.oauth === "normal") {
        // Check cache first
        const cachedUser = userCache.get(decoded.userId);
        const now = Date.now();

        if (cachedUser && (now - cachedUser.timestamp) < CACHE_TTL) {
          userData = cachedUser.data;
        } else {
          // Cache miss or expired, fetch from DB
          const userResult = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.username,
              role: users.role,
              oauth: users.oauth
            })
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

          if (userResult.length === 0) {
            const errorResponse = ErrorBuilder.build(
              ErrorCode.UNAUTHORIZED,
              'User not found'
            );
            return res.status(ERROR_STATUS_MAP[ErrorCode.UNAUTHORIZED]).json(errorResponse);
          }

          userData = {
            id: userResult[0].id,
            email: userResult[0].email,
            name: userResult[0].name || userResult[0].email.split('@')[0] || 'User',
            role: userResult[0].role,
            oauth: userResult[0].oauth
          };

          // Cache the user data
          userCache.set(decoded.userId, {
            data: userData,
            timestamp: now
          });
        }
      } else {
        // 4. OAuth users (Google/Facebook)
        userData = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.email.split('@')[0] || 'OAuth User', // Use email prefix as name
          role: decoded.role,
          oauth: decoded.oauth
        };
      }

      // 5. Role check if allowedRole is specified
      if (allowedRole && userData.role !== allowedRole && userData.role !== "admin") {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.FORBIDDEN,
          'Unauthorized role'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.FORBIDDEN]).json(errorResponse);
      }

      // 6. Attach user to request
      req.user = userData;
      console.log(userData.name);
      

      next();

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          'Token expired'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.UNAUTHORIZED]).json(errorResponse);
      } else if (error instanceof jwt.JsonWebTokenError) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          'Invalid token'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.UNAUTHORIZED]).json(errorResponse);
      } else {
        console.error('Auth middleware error:', error);
        const errorResponse = ErrorBuilder.build(
          ErrorCode.INTERNAL_SERVER_ERROR,
          'Authentication failed'
        );
        return res.status(ERROR_STATUS_MAP[ErrorCode.INTERNAL_SERVER_ERROR]).json(errorResponse);
      }
    }
  };
};
