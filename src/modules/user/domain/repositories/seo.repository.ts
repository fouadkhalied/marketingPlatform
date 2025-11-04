import { SeoVariable, CreateSeoVariable } from "../../../../infrastructure/shared/schema/schema";

export interface seoInterface {
  getAllSeoVariables(): Promise<SeoVariable[]>;
  getSeoVariableById(id: string): Promise<SeoVariable | undefined>;
  createSeoVariable(data: CreateSeoVariable): Promise<SeoVariable>;
  updateSeoVariable(id: string, updates: Partial<CreateSeoVariable>): Promise<SeoVariable>;
  deleteSeoVariable(id: string): Promise<boolean>;
}