import { InjectModel } from "@nestjs/sequelize";
import { AttributeRepositoryInterface } from "src/attribute/domain/interface/attribute.interface";
import { AttributeModel } from "../models/attribute.model";
import { Attribute } from "src/attribute/domain/entities/attribute.entity";
import { FindAttributeOptions, Op, Order, WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

export class AttributeRepository  implements AttributeRepositoryInterface {
    constructor(
        @InjectModel(AttributeModel)
        private attributeModel: typeof AttributeModel
    ){}
    private ToEntity(model: AttributeModel) {
        return new Attribute(model.toJSON());
    }
   private buildQuery(options: {
        limit: number;
        offset: number;
        condition?: WhereOptions<AttributeModel> | Partial<AttributeModel>;
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
    async findAttributeById(id: number, attributes?: string[]): Promise<Attribute | null> {
        const queryOptions: {
            where: { id: number };
            attributes?: string[];
        } = {
            where : {id}
        }
        if(attributes){
            queryOptions.attributes = attributes;
        }
        const model = await this.attributeModel.findOne(queryOptions);
        return model ? this.ToEntity(model) : null;
    }
    async createAttribute(data: Partial<Attribute>): Promise<Attribute> {
        const  model = await this.attributeModel.create(data);
        return this.ToEntity(model);
    }
    async updateAttributeBy(condition: Partial<Attribute>, data: Partial<Attribute>): Promise<boolean> {
        const [affectedCount] = await this.attributeModel.update(data, { where: condition });
        return affectedCount > 0;
    }
    async deleteAttribute(condition: Partial<Attribute>): Promise<boolean> {
        const deletedCount = await this.attributeModel.destroy({ where: condition });
        return deletedCount > 0;
    }
    async searchAttribute(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]): Promise<{ rows: Attribute[]; count: number }> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition: {
                ten_thuoc_tinh: { [Op.like]: `%${keyword}%` }
            }
        });
        if(order && order.length > 0){
            queryOptions.order = order;
        }
        if(attributes && attributes.length > 0){
            queryOptions.attributes = attributes;
        }
        const { rows, count } = await this.attributeModel.findAndCountAll(queryOptions);
        return { rows: rows.map(model => this.ToEntity(model)), count };
    }
    async findAttributeBy(condition: Partial<Attribute>): Promise<Attribute | null> {
        const model = await this.attributeModel.findOne({ where: condition });
        return model ? this.ToEntity(model) : null;
    }
    async findAndCountAttributeBy(limit: number, offset: number, attributes?: string[], condition?: Partial<Attribute>, order?: [string, SortOderType][]): Promise<{ rows: Attribute[]; count: number }> {
        const queryOptions = this.buildQuery({
            limit: limit,
            offset: offset,
            condition: condition
        });
        if(order && order.length > 0){
            queryOptions.order = order;
        }
        if(attributes && attributes.length > 0){
            queryOptions.attributes = attributes;
        }
        const { rows, count } = await this.attributeModel.findAndCountAll(queryOptions);
        return { rows: rows.map(model => this.ToEntity(model)), count };
    }
    async findAttributeByExceptId(condition: Partial<Attribute>, id: number): Promise<Attribute | null> {
        const queryOptions = {
            where: {
                ...condition,
                id: { [Op.ne]: id }
            }
        };
        const model = await this.attributeModel.findOne(queryOptions);
        return model ? this.ToEntity(model) : null;
    }
}