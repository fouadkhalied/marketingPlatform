import * as jwt from 'jsonwebtoken';
import * as bcrypt from "bcrypt";
import { JwtPayload } from '../interfaces/jwtPayload';
import { appConfig } from '../../../../config/app.config';

export class JwtService {

  private secretKey : string
  constructor() {
    this.secretKey = appConfig.JWT_SECRET
  }

  sign(payload : JwtPayload) : string {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      this.secretKey,
      { expiresIn: '30d' }
    );
  }

  verify(token: string): JwtPayload {
    try {
      // The `Secret` type for `this.secretKey` ensures this call is correct
      const decoded = jwt.verify(token, this.secretKey) as JwtPayload;
      return decoded;
    } catch (error) {
      // A more specific error handling could be implemented here
      throw new Error('Invalid or expired token.');
    }
  }


  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}