import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/sequelize";
import { BannerRepositoryInterface } from "src/banner/domain/interface/banner.interface";
import { BannerModel } from "../models/banner.model";
import { Banner } from "src/banner/domain/entities/banner.entity";
import { FindAttributeOptions, Op, Order, Sequelize, Transaction, WhereOperators, WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

@Injectable()
export class BannerRepository implements BannerRepositoryInterface{
    constructor(
        @InjectModel(BannerModel)
        private readonly bannerModel: typeof BannerModel,
        @InjectConnection()
        private readonly sequelize: Sequelize
    ){}

    private toEntity(model: BannerModel){
        return new Banner(model.toJSON());
    }
    private buildQuery(options: {
                limit: number;
                offset: number;
                condition?: WhereOptions<Banner> | Partial<Banner>;
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
    async findBannerById(id: number, attributes?: string[]): Promise<Banner | null> {
        const queryOptions: {
            where: { id: number };
            attributes?: string[];
        } = {
            where: { id }
        };

        if (attributes &&  attributes.length > 0) {
            queryOptions.attributes = attributes;
        }

        const bannerModel = await this.bannerModel.findOne(queryOptions);
        return bannerModel ? this.toEntity(bannerModel) : null;
    }
    async createBanner( data: Partial<Banner>): Promise<Banner> {
        const bannerModel = await this.bannerModel.create(data);
        return this.toEntity(bannerModel);
    }
    async updateBannerBy(condition: Partial<Banner>, data: Partial<Banner>, transaction?: Transaction): Promise<boolean> {
        const [affectedCount] = await this.bannerModel.update(data, { where: condition, transaction });
        return affectedCount > 0;
    }
    async deleteBanner(condition: Partial<Banner>, transaction?: Transaction): Promise<boolean> {
        const affectedCount = await this.bannerModel.destroy({ where: condition, transaction });
        return affectedCount > 0;
    }
    async searchBanner(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{rows: Banner[] , count: number}> {
        const query = this.buildQuery({
            limit,
            offset,
            condition: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { url: { [Op.like]: `%${keyword}%` } }
                ]
            },
        });
        if(attributes && attributes.length > 0){
            query.attributes = attributes;
        }
        const { rows, count } = await this.bannerModel.findAndCountAll(query);
        return {
            rows: rows.map((row) => this.toEntity(row)),
            count
        };
    }
    async findBannerBy(condition: Partial<Banner>): Promise<Banner | null> {
        const bannerModel = await this.bannerModel.findOne({ where: condition });
        return bannerModel ? this.toEntity(bannerModel) : null;
    }
    async findAndCountBannerBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<Banner>): Promise<{ rows: Banner[]; count: number; }> {
        const query = this.buildQuery({
            limit,
            offset,
            condition
        });
        if(attributes && attributes.length > 0){
            query.attributes = attributes;
        }
        if(order && order.length > 0){
            query.order = order;
        }
        const { rows, count } = await this.bannerModel.findAndCountAll(query);
        return {
            rows: rows.map((row) => this.toEntity(row)),
            count
        };
    }
    async getMaxValueOfField(fieldName: keyof Banner,condition?: Partial<Banner>): Promise<number | null>{
        const maxValue = await  this.bannerModel.max(fieldName as string, { where: condition });
        if(maxValue === null || maxValue === undefined || Number.isNaN(maxValue)){
            return null
        }
        return maxValue as number;
    }
    async incrementField(field: keyof Banner, amount: number, condition?: Partial<Banner>): Promise<void> {
        await this.bannerModel.increment(field as string, { by: amount, where: condition });
    }
    async adjustOrderInRange(
        amount: number,
        range: { gt?: number; lte?: number; gte?: number; lt?: number },
        transaction?: Transaction  
        ): Promise<void> {
        const sttCondition: WhereOperators = {};

        if (range.gt !== undefined) sttCondition[Op.gt] = range.gt;
        if (range.lte !== undefined) sttCondition[Op.lte] = range.lte;
        if (range.gte !== undefined) sttCondition[Op.gte] = range.gte;
        if (range.lt !== undefined) sttCondition[Op.lt] = range.lt;

        await this.bannerModel.increment(
            { stt: amount },
            {
            where: { stt: sttCondition },
            transaction  
            }
        );
    }
    async adjustOrderWithTransaction(
    currentStt: number,
    newStt: number
    ): Promise<void> {
        await this.sequelize.transaction(async (t) => {
            if (newStt > currentStt) {
            await this.adjustOrderInRange(-1, { gt: currentStt, lte: newStt }, t);
            } else {
            await this.adjustOrderInRange(+1, { gte: newStt, lt: currentStt }, t);
            }
        });
    }
    async findBannerByExceptId(condition: Partial<Banner>, id: number): Promise<Banner | null> {
        const bannerModel = await this.bannerModel.findOne({ where: { ...condition, id: { [Op.ne]: id } } });
        return bannerModel ? this.toEntity(bannerModel) : null;
    }
    async executeTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
        return this.sequelize.transaction(callback);
    }
}