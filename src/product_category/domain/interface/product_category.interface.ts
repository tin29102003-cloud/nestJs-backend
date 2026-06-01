import { SortOderType } from "src/common/constants/user.constaint.js";
import { ProductCategory } from "../entities/product_category.entity.ts";

export const PRODUCT_CATEGORY_REPOSITORY_INTERFACE = Symbol('ProductCategoryRepositoryInterface');
export interface ProductCategoryRepositoryInterface {
    findProductCategoryById(id: number, attributes?: string[]): Promise<ProductCategory | null>;
    createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory>;
    updateProductCategoryBy(condition: Partial<ProductCategory>, data: Partial<ProductCategory>, transaction?: unknown): Promise<boolean>;
    deleteProductCategory(condition: Partial<ProductCategory>, transaction?: unknown): Promise<boolean>;
    searchProductCategory(keyword: string, limit: number, offset: number, attributes?: string[], Order?: [string, SortOderType][]): Promise<{ rows: ProductCategory[]; count: number }>;
    findProductCategoryBy(condition: Partial<ProductCategory>): Promise<ProductCategory | null>;
    findAndCountProductCategoryBy(limit: number, offset: number, order?: [string, 'ASC' | 'DESC'][], attributes?: string[], condition?: Partial<ProductCategory>): Promise<{ rows: ProductCategory[]; count: number }>;
    getMaxValueOfField(fieldName: keyof ProductCategory, condition?: Partial<ProductCategory>): Promise<number | null>;
    hasChildren(id: number): Promise<boolean>;
    executeTransaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>;
    adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: unknown): Promise<void>;
    findProductCategoryByExceptId(condition: Partial<ProductCategory>, id: number): Promise<ProductCategory | null>;
}