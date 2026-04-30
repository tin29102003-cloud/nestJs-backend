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