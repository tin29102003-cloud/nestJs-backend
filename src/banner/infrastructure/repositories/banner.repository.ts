import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { BannerRepositoryInterface } from "src/banner/domain/interface/banner.interface";
import { BannerModel } from "../models/banner.model";
import { Banner } from "src/banner/domain/entities/banner.entity";
import { FindAttributeOptions, Op, Order, WhereOptions } from "sequelize";
import { SortOderType } from "src/common/constants/user.constaint";

@Injectable()
export class BannerRepository implements BannerRepositoryInterface{
    constructor(
        @InjectModel(BannerModel)
        private readonly bannerModel: typeof BannerModel
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
    async createBannerBy(condition: Partial<Banner>, data: Partial<Banner>): Promise<Banner> {
        const bannerModel = await this.bannerModel.create({ ...condition, ...data });
        return this.toEntity(bannerModel);
    }
    async updateBannerBy(condition: Partial<Banner>, data: Partial<Banner>): Promise<boolean> {
        const [affectedCount] = await this.bannerModel.update(data, { where: condition });
        return affectedCount > 0;
    }
    async deleteBanner(condition: Partial<Banner>): Promise<boolean> {
        const affectedCount = await this.bannerModel.destroy({ where: condition });
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
    async findAndCountUserBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[], condition?: Partial<Banner>): Promise<{ rows: Banner[]; count: number; }> {
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
}