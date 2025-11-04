import { db } from "../../../../infrastructure/db/connection";
import { seoInterface } from "../../domain/repositories/seo.repository";
import { eq, sql } from "drizzle-orm";
import { seoVariables, CreateSeoVariable } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { SeoVariableInterface } from "../../application/dtos/seoVariable.dto";

export class SeoRepositoryImpl implements seoInterface {
  
  // Get all SEO variables
  async getAllSeoVariables(): Promise<SeoVariableInterface[]> {
    try {
      const variables = await db
        .select()
        .from(seoVariables);
      
      return variables;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch SEO variables",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Get SEO variable by ID
  async getSeoVariableById(id: string): Promise<SeoVariableInterface | undefined> {
    try {
      const [variable] = await db
        .select()
        .from(seoVariables)
        .where(eq(seoVariables.id, id));
      
      return variable;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Create SEO variable
  async createSeoVariable(data: CreateSeoVariable): Promise<SeoVariableInterface> {
    try {
      const [variable] = await db
        .insert(seoVariables)
        .values(data)
        .returning();
      
      if (!variable) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to create SEO variable"
        );
      }

      return variable;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to create SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Update SEO variable
  async updateSeoVariable(id: string, updates: Partial<CreateSeoVariable>): Promise<SeoVariableInterface> {
    try {
      const [variable] = await db
        .update(seoVariables)
        .set(updates)
        .where(eq(seoVariables.id, id))
        .returning();
      
      if (!variable) {
        throw ErrorBuilder.build(
          ErrorCode.SEO_NOT_FOUND,
          "SEO variable not found"
        );
      }

      return variable;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Delete SEO variable
  async deleteSeoVariable(id: string): Promise<boolean> {
    try {
      const [deleted] = await db
        .delete(seoVariables)
        .where(eq(seoVariables.id, id))
        .returning();
      
      return !!deleted;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }
}