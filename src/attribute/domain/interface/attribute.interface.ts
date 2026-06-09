import { SortOderType } from "src/common/constants/user.constaint";
import { Attribute } from "../entities/attribute.entity";

export  const ATTRIBUTE_REPOSITORY_INTERFACE = Symbol('AttributeRepositoryInterface');
export interface AttributeRepositoryInterface {
    findAttributeById(id: number, attributes?: string[]): Promise<Attribute | null>;
    createAttribute(data: Partial<Attribute>): Promise<Attribute>;
    updateAttributeBy(condition: Partial<Attribute>, data: Partial<Attribute>): Promise<boolean>;
    deleteAttribute(condition: Partial<Attribute>): Promise<boolean>;
    searchAttribute(keyword: string, limit: number, offset: number, attributes?: string[], order?: [string, SortOderType][]): Promise<{ rows: Attribute[]; count: number }>;
    findAttributeBy(condition: Partial<Attribute>): Promise<Attribute | null>;
    findAndCountAttributeBy(limit: number, offset: number, attributes?: string[], condition?: Partial<Attribute>, order?: [string, SortOderType][]): Promise<{ rows: Attribute[]; count: number }>;
    findAttributeByExceptId(condition: Partial<Attribute>, id: number): Promise<Attribute | null>;
}