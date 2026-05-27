import { NewsCategory } from "src/news_category/domain/entities/news-category.entity";
import { NewsCategoryRepositoryInterface } from "src/news_category/domain/interface/news_category.interface";
import { NewsCategoryModel } from "../models/news-category.model";
import { InjectModel } from "@nestjs/sequelize";
import { FindAttributeOptions, Op, Order, WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

export class NewsCategoryRepository implements NewsCategoryRepositoryInterface {
    constructor(
        @InjectModel(NewsCategoryModel)
        private newsCategoryModel: typeof NewsCategoryModel

    ){}
    private ToEntity(model:NewsCategoryModel) {
        return new NewsCategory(model.toJSON());
    }
    private buildQuery(options: {
        limit: number;
        offset: number;
        condition?: WhereOptions<NewsCategory> | Partial<NewsCategory>;
        order?: Order;
        attributes?: FindAttributeOptions;
    }){
        return {
            where: options.condition ?? {},
            limit: options.limit,
            offset: options.offset,
            order: options.order,
            attributes: options.attributes
        };
    }
    async findNewsCategoryById(id: number, attributes?: string[]): Promise<NewsCategory | null> {
        const  queryOptions: {
            where: { id: number };
            attributes?: string[];
        } = {
            where: { id }
        };
        if (attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        const newsCategoryModel = await this.newsCategoryModel.findOne(queryOptions);
        return newsCategoryModel ? this.ToEntity(newsCategoryModel) : null;
    }
    async createNewsCategory( data: Partial<NewsCategory>): Promise<NewsCategory> {
        const newsCategoryModel = await this.newsCategoryModel.create(data);
        return this.ToEntity(newsCategoryModel);
    }
    async updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>): Promise<boolean> {
        const [affectedCount] = await this.newsCategoryModel.update(data, { where: condition });
        return affectedCount > 0;
    }
    async deleteNewsCategory(condition: Partial<NewsCategory>): Promise<boolean> {
        const deletedCount = await this.newsCategoryModel.destroy({ where: condition });
        return deletedCount > 0;
    }
    async searchNewsCategory(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{rows: NewsCategory[] , count: number}> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition: {
                ten_dm: { [Op.like]: `%${keyword}%` } ,
            },
        });
        if (attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        const { rows, count } = await this.newsCategoryModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
    async findNewsCategoryBy(condition: Partial<NewsCategory>): Promise<NewsCategory | null> {
        const newsCategoryModel = await this.newsCategoryModel.findOne({ where: condition });
        return newsCategoryModel ? this.ToEntity(newsCategoryModel) : null;
    }
    async findAndCountNewsCategoryBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<NewsCategory>): Promise<{rows: NewsCategory[] , count: number}> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition
        });
        if (order && order.length > 0) {
            queryOptions.order = order;
        }
        if (attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        const { rows, count } = await this.newsCategoryModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
    async getMaxValueOfField(fieldName: keyof NewsCategory, condition?: Partial<NewsCategory>): Promise<number | null> {
        const maxValue = await this.newsCategoryModel.max(fieldName as string, { where: condition });
        if(maxValue === null || maxValue === undefined || Number.isNaN(maxValue)){
            return null;
        }
        return maxValue as number; 
    }
}