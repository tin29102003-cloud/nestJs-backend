import { SortOderType } from "src/common/constants/user.constaint";
import { Banner } from "../entities/banner.entity";

export const BANNER_REPOSITORY_INTERFACE = Symbol('BannerRepositoryInterface');
export interface BannerRepositoryInterface{
    findBannerById(id: number, attributes?: string[]): Promise<Banner | null>;
    createBannerBy(condition: Partial<Banner>, data: Partial<Banner>): Promise<Banner>;
    updateBannerBy(condition: Partial<Banner>, data: Partial<Banner>): Promise<boolean>;
    deleteBanner(condition: Partial<Banner>): Promise<boolean>;
    searchBanner(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{rows: Banner[] , count: number}>;
    findBannerBy(condition: Partial<Banner>):Promise<Banner | null>;
    findAndCountUserBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<Banner>): Promise<{rows: Banner[] , count: number}>;

}