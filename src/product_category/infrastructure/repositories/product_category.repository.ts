import { ProductCategoryRepositoryInterface } from "src/product_category/domain/interface/product_category.interface";
import { ProductCategoryModel } from "../models/product_category.model";
import { InjectConnection, InjectModel } from "@nestjs/sequelize/dist/common/sequelize.decorators";
import { FindAttributeOptions, Op, Order, Sequelize, Transaction, WhereOperators, WhereOptions } from "sequelize";
import { ProductCategory } from "src/product_category/domain/entities/product_category.entity.ts";
import { SortOderType } from "src/common/constants/user.constaint";
export class ProductCategoryRepository implements ProductCategoryRepositoryInterface {
    constructor(
        @InjectModel(ProductCategoryModel)
        private productCategoryModel: typeof ProductCategoryModel,
        @InjectConnection()
        private readonly sequelize: Sequelize
    ) {
      
    }
    private ToEntity(model: ProductCategoryModel) {
        return new ProductCategory(model.toJSON());
    }
    private buildQuery(options: {
        limit: number;
        offset: number;
        condition?: WhereOptions<ProductCategory> | Partial<ProductCategory>;
        order?: Order;
        attributes?: FindAttributeOptions;
    }) {
        return {
            where: options.condition ?? {},
            limit: options.limit,
            offset: options.offset,
            order: options.order,
            attributes: options.attributes
        };
    }
    async findProductCategoryById(id: number, attributes?: string[]): Promise<ProductCategory | null> {
        const queryOptions: {
            where: { id: number };
            attributes?: string[];
        } = {
            where: { id }
        };
        if (attributes) {
            queryOptions.attributes = attributes;
        }
        const model = await this.productCategoryModel.findOne(queryOptions);
        return model ? this.ToEntity(model) : null;
    }
    async createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
        const model = await this.productCategoryModel.create(data);
        return this.ToEntity(model);
    }
    async updateProductCategoryBy(condition: Partial<ProductCategory>, data: Partial<ProductCategory>, transaction?: Transaction): Promise<boolean> {
        const [affectedCount] = await this.productCategoryModel.update(data, { where: condition, transaction });
        return affectedCount > 0;
    }
    async deleteProductCategory(condition: Partial<ProductCategory>, transaction?: Transaction): Promise<boolean> {
        const deletedCount = await this.productCategoryModel.destroy({ where: condition, transaction });
        return deletedCount > 0;
    }
    async searchProductCategory(keyword: string, limit: number, offset: number, attributes?: string[], Order?: [string, SortOderType][]): Promise<{ rows: ProductCategory[]; count: number }> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition: {
                [Op.or]: [
                    { ten_dm: { [Op.like]: `%${keyword}%` } },
                    { slug: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });
        if (Order && Order.length > 0) {
            queryOptions.order = Order;
        }
        if (attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        
        const { rows, count } = await this.productCategoryModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
    async findProductCategoryBy(condition: Partial<ProductCategory>): Promise<ProductCategory | null> {
        const model = await this.productCategoryModel.findOne({ where: condition });
        return model ? this.ToEntity(model) : null;
    }
    async findAndCountProductCategoryBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<ProductCategory>): Promise<{ rows: ProductCategory[]; count: number }> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition
        });
        if(order && order.length > 0){
            queryOptions.order = order;
        }
        if (attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        const { rows, count } = await this.productCategoryModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
    async getMaxValueOfField(fieldName: keyof ProductCategory, condition?: Partial<ProductCategory>): Promise<number | null> {
        const result = await this.productCategoryModel.max(fieldName as string, { where: condition });
        if(result === null || result === undefined || Number.isNaN(result)){
            return null;
        }
        return result as number;
    }
    async hasChildren(id: number): Promise<boolean> {
        const count = await this.productCategoryModel.count({ where: { parent_id: id } });
        return count > 0;
    }
    async executeTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
        return this.sequelize.transaction(callback);
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
        await this.productCategoryModel.increment(
            { stt: amount },
            { where: { stt: sttCondition }, transaction }
        );
    }
    async findProductCategoryByExceptId(condition: Partial<ProductCategory>, id: number): Promise<ProductCategory | null> {
        const queryCondition = {
            ...condition,
            id: { [Op.ne]: id }
        };
        const model = await this.productCategoryModel.findOne({ where: queryCondition });
        return model ? this.ToEntity(model) : null;
    }
}