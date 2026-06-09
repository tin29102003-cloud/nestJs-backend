import { SortOderType, SortOrder } from "src/common/constants/user.constaint";
import { PTTT } from "../entities/pttt.entity";

export const PTTT_REPOSITORY_INTERFACE = Symbol('PTTTRepositoryInterface');
export interface PTTTRepositoryInterface {
    findPTTTById(id: number, attributes?: string[]): Promise<PTTT | null>;
    createPTTT(data: Partial<PTTT>): Promise<PTTT>;
    updatePTTTBy(condition: Partial<PTTT>, data: Partial<PTTT>): Promise<boolean>;
    deletePTTT(condition: Partial<PTTT>): Promise<boolean>;
    searchPTTT(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]): Promise<{ rows: PTTT[]; count: number }>;
    findPTTTBy(condition: Partial<PTTT>): Promise<PTTT | null>;
    findAndCountPTTTBy(limit: number, offset: number, order?: [string,SortOderType][], attributes?: string[], condition?: Partial<PTTT>): Promise<{ rows: PTTT[]; count: number }>;
    findPtttByOr(condition: Partial<PTTT>[]): Promise<PTTT | null>;
    findPTTTByExceptId(condition: Partial<PTTT>, id: number): Promise<PTTT | null>;
}