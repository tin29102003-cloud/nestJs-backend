import { InjectModel } from "@nestjs/sequelize";
import { PTTTRepositoryInterface } from "src/pttt/domain/interface/pttt.interface";
import { PTTTModel } from "../models/pttt.model";
import { PTTT } from "src/pttt/domain/entities/pttt.entity";
import { FindAttributeOptions, Op, Order,  WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

export class PTTTRepository implements  PTTTRepositoryInterface {
    constructor(
        @InjectModel(PTTTModel)
        private ptttModel: typeof PTTTModel
        
    ){}
    private ToEntity(model:PTTTModel) {
        return new PTTT(model.toJSON());
    }
    private buildQuery(options: {
        limit: number;
        offset: number;
        condition?: WhereOptions<PTTT> | Partial<PTTT>;
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
    async findPTTTById(id: number, attributes?: string[]): Promise<PTTT | null> {
            const  queryOptions: {
                where: { id: number };
                attributes?: string[];
            } = {
                where: { id }
            };
            if (attributes && attributes.length > 0) {
                queryOptions.attributes = attributes;
            }
            const ptttModel = await this.ptttModel.findOne(queryOptions);
            return ptttModel ? this.ToEntity(ptttModel) : null;
    }
    async createPTTT( data: Partial<PTTT>): Promise<PTTT> {
        const ptttModel = await this.ptttModel.create(data);
        return this.ToEntity(ptttModel);
    }
    async updatePTTTBy(condition: Partial<PTTT>, data: Partial<PTTT>): Promise<boolean> {
            const [affectedCount] = await this.ptttModel.update(data, { where: condition });
            return affectedCount > 0;
        }
    async deletePTTT(condition: Partial<PTTT>): Promise<boolean> {
        const deletedCount = await this.ptttModel.destroy({ where: condition });
        return deletedCount > 0;
    }
    async searchPTTT(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]): Promise<{ rows: PTTT[]; count: number }> {
        const queryOptions = this.buildQuery({
            limit,
            offset,
            condition: {
                [Op.or]: [
                    { ten_pt: { [Op.like]: `%${keyword}%` } },
                    { code: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });
        if(attributes && attributes.length > 0) {
            queryOptions.attributes = attributes;
        }
        if(order && order.length > 0) {
            queryOptions.order = order;
        }

        const { rows, count } = await this.ptttModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
    async findPTTTBy(condition: Partial<PTTT>): Promise<PTTT | null> {
        const ptttModel = await this.ptttModel.findOne({ where: condition });
        return ptttModel ? this.ToEntity(ptttModel) : null;
    }
    async findAndCountPTTTBy(limit: number, offset: number, order?: [string,SortOderType][], attributes?: string[], condition?: Partial<PTTT>): Promise<{ rows: PTTT[]; count: number }> {
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
        const { rows, count } = await this.ptttModel.findAndCountAll(queryOptions);
        return {
            rows: rows.map((row) => this.ToEntity(row)),
            count
        };
    }
     async findPtttByOr(condition: Partial<PTTT>[]): Promise<PTTT | null> {
        const pttt =  await this.ptttModel.findOne({
            where: {
                [Op.or] : condition
            }
        })
        return  pttt ? this.ToEntity(pttt): null;
    }
    async findPTTTByExceptId(condition: Partial<PTTT>, id: number): Promise<PTTT | null> {
        const queryOptions = {
            ...condition,
            id: {[Op.not]: id}
        };
        const pttt = await this.ptttModel.findOne({ where: queryOptions });
        return pttt ? this.ToEntity(pttt) : null;
    }
    
}