// user/interfaces/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserAppService } from "../../application/services/user-app.service";
import { CreateUser } from '../../../../infrastructure/shared/schema/schema';

// Custom request interfaces for better type safety
interface CreateUserRequest extends Request {
  body: CreateUser;
}

interface GetUserByIdRequest extends Request {
  params: { id: string };
}

interface GetUserByEmailRequest extends Request {
  query: { email: string };
}

interface GetUserByUsernameRequest extends Request {
  query: { username: string };
}

interface UpdateStripeInfoRequest extends Request {
  params: { id: string };
  body: { customerId: string; subscriptionId?: string };
}

// Standardized response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class UserController {
  constructor(private readonly userService: UserAppService) {}

  // Create a new user
  async createUser(req: CreateUserRequest, res: Response): Promise<Response<ApiResponse>> {
    try {
      const newUser = await this.userService.createUser(req.body);
      
      return res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to create user'
      });
    }
  }

  // Get user by ID
  async getUser(req: GetUserByIdRequest, res: Response): Promise<Response<ApiResponse>> {
    try {
      const user = await this.userService.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err: any) {
      console.error('Error fetching user:', err);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user by email
  async getUserByEmail(req: GetUserByEmailRequest, res: Response): Promise<Response<ApiResponse>> {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email parameter is required'
        });
      }

      const user = await this.userService.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err: any) {
      console.error('Error fetching user by email:', err);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user by username
  async getUserByUsername(req: GetUserByUsernameRequest, res: Response): Promise<Response<ApiResponse>> {
    try {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username parameter is required'
        });
      }

      const user = await this.userService.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err: any) {
      console.error('Error fetching user by username:', err);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update Stripe info
  async updateUserStripeInfo(req: UpdateStripeInfoRequest, res: Response): Promise<Response<ApiResponse>> {
    try {
      const { id } = req.params;
      const { customerId, subscriptionId } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
      }

      const updatedUser = await this.userService.updateUserStripeInfo(
        id,
        customerId,
        subscriptionId
      );

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Stripe information updated successfully'
      });
    } catch (err: any) {
      console.error('Error updating Stripe info:', err);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update Stripe information'
      });
    }
  }
}