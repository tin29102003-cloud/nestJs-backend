export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC'
}
export type  SortOderType =
    | 'ASC'
    | 'DESC';
export const ROLE_MAP: Record<number, string> = {
    0: 'public',
    1: 'admin',
}
export interface AllowedUpdateUser {
    
    mat_khau?: string;
    mat_khau_nhap_lai?: string;
    ho_ten?:string;
    dien_thoai?:string;
    vai_tro?: number;
    hinh?:string| null;
    token_version?: number;
}