import { SortOderType } from "src/common/constants/user.constaint";
import { NewsCategory } from "../entities/news-category.entity";


export const NEWS_CATEGORY_REPOSITORY_INTERFACE =  Symbol('NewsCategoryRepositoryInterface');
export interface NewsCategoryRepositoryInterface{
    findNewsCategoryById(id: number, attributes?: string[]): Promise<NewsCategory | null>;
    createNewsCategory( data: Partial<NewsCategory>): Promise<NewsCategory>;
    updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>, transaction?: unknown): Promise<boolean>;
    deleteNewsCategory(condition: Partial<NewsCategory>, transaction?: unknown): Promise<boolean>;
    searchNewsCategory(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{rows: NewsCategory[] , count: number}>;
    findNewsCategoryBy(condition: Partial<NewsCategory>):Promise<NewsCategory | null>;
    findAndCountNewsCategoryBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<NewsCategory>): Promise<{rows: NewsCategory[] , count: number}>;
    getMaxValueOfField(fieldName: keyof NewsCategory,condition?: Partial<NewsCategory>): Promise<number | null>;
    incrementField(field: keyof NewsCategory, amount: number, condition?: Partial<NewsCategory>): Promise<void>
    adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: unknown): Promise<void> 
    adjustOrderWithTransaction(currentStt: number, newStt: number): Promise<void>;
    findNewsCategoryByExceptId(condition: Partial<NewsCategory>, id: number): Promise<NewsCategory | null>;
    hasChildren(id: number): Promise<boolean>;
    executeTransaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>;
}
