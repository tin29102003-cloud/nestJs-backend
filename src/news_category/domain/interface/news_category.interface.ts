import { SortOderType } from "src/common/constants/user.constaint";
import { NewsCategory } from "../entities/news-category.entity";

export const NEWS_CATEGORY_REPOSITORY_INTERFACE =  Symbol('NewsCategoryRepositoryInterface');
export interface NewsCategoryRepositoryInterface{
    findNewsCategoryById(id: number, attributes?: string[]): Promise<NewsCategory | null>;
    createNewsCategory( data: Partial<NewsCategory>): Promise<NewsCategory>;
    updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>): Promise<boolean>;
    deleteNewsCategory(condition: Partial<NewsCategory>): Promise<boolean>;
    searchNewsCategory(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{rows: NewsCategory[] , count: number}>;
    findNewsCategoryBy(condition: Partial<NewsCategory>):Promise<NewsCategory | null>;
    findAndCountNewsCategoryBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<NewsCategory>): Promise<{rows: NewsCategory[] , count: number}>;
    getMaxValueOfField(fieldName: keyof NewsCategory,condition?: Partial<NewsCategory>): Promise<number | null>;
}
