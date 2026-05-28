import { NewsCategory } from "src/news_category/domain/entities/news-category.entity";
import { NewsCategoryRepositoryInterface } from "src/news_category/domain/interface/news_category.interface";
import { NewsCategoryModel } from "../models/news-category.model";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { FindAttributeOptions, Op, Order, Sequelize, Transaction, WhereOperators, WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

export class NewsCategoryRepository implements NewsCategoryRepositoryInterface {
    constructor(
        @InjectModel(NewsCategoryModel)
        private newsCategoryModel: typeof NewsCategoryModel,
        @InjectConnection()
        private readonly sequelize: Sequelize
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
    async updateNewsCategoryBy(condition: Partial<NewsCategory>, data: Partial<NewsCategory>, transaction?: Transaction): Promise<boolean> {
        const [affectedCount] = await this.newsCategoryModel.update(data, { where: condition, transaction });
        return affectedCount > 0;
    }
    async deleteNewsCategory(condition: Partial<NewsCategory>, transaction?: Transaction): Promise<boolean> {
        const deletedCount = await this.newsCategoryModel.destroy({ where: condition, transaction });
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
    async incrementField(field: keyof NewsCategory, amount: number, condition?: Partial<NewsCategory>): Promise<void> {
        await this.newsCategoryModel.increment(field as string, { by: amount, where: condition });
    }
    async adjustOrderInRange(amount: number, range: { gt?: number; lte?: number; gte?: number; lt?: number }, transaction?: Transaction): Promise<void> {
        const sttCondition: WhereOperators = {};
        if(range.gt !== undefined){
            sttCondition[Op.gt] = range.gt;
        }
        if(range.gte !== undefined){
            sttCondition[Op.gte] = range.gte;
        }
        if(range.lt !== undefined){
            sttCondition[Op.lt] = range.lt;
        }
        if(range.lte !== undefined){
            sttCondition[Op.lte] = range.lte;
        }
        await this.newsCategoryModel.increment(
            { stt: amount },
            { where: { stt: sttCondition }, transaction }
        );
    }
    async adjustOrderWithTransaction(currentStt: number, newStt: number): Promise<void> {
        await this.sequelize.transaction(async (t) => {
            if (newStt > currentStt) {
                await this.adjustOrderInRange(-1, { gt: currentStt, lte: newStt }, t);
            } else {
                await this.adjustOrderInRange(+1, { gte: newStt, lt: currentStt }, t);
            }
        });
    }
    async findNewsCategoryByExceptId(condition: Partial<NewsCategory>, id: number): Promise<NewsCategory | null> {
        const newsCategoryModel = await this.newsCategoryModel.findOne({ where: { ...condition, id: { [Op.ne]: id } } });//do có bỏ condition trong {} nên phải có dấu ... để giải nén condition ra ngoài, nếu không sẽ bị lỗi vì không thể có 2 trường id trong where được
        return newsCategoryModel ? this.ToEntity(newsCategoryModel) : null;
    } 
    async hasChildren(id: number): Promise<boolean> {
        const count = await this.newsCategoryModel.count({ where: { parent_id: id } });
        return count > 0;
    }
    //đây là một cách  viết transaction tự rollback commit nếu thành công của sequelize, cách này sẽ giúp code gọn hơn rất nhiều thay vì phải viết try catch và tự commit rollback như cách truyền thống
    async executeTransaction<T>(
        callback: (transaction: Transaction) => Promise<T>
    ): Promise<T> {

        return this.sequelize.transaction(callback);
    }
    
}