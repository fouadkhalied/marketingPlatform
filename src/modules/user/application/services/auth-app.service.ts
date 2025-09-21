import { eq } from "drizzle-orm";
import { users } from "../../../../infrastructure/shared/schema/schema";
import { NextFunction, Request, Response } from "express";
import { db } from "../../../../infrastructure/db/connection";
import jwt from 'jsonwebtoken';



interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}


export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // 2. Verify JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // 3. Get user from database using Drizzle ORM
        const userResult = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role
            })
            .from(users)
            .where(eq(users.id, decoded.userId))
            .limit(1);

        if (userResult.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = userResult[0];

        // 4. Attach user to request object
        req.user = {
            userId: parseInt(user.id),
            email: user.email,
            role: user.role
        };

        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            console.error('Auth middleware error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }
};