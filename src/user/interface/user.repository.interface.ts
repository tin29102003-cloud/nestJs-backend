import { User } from "../user.model";
export const  USER_REPOSITORY_INTERFACE = 'UserRepositoryIntereface';
export interface UserRepositoryIntereface{
    findUserByEmail(tai_khoan: string): Promise<User | null>;
    FindUserById(id: number): Promise<User | null>;
    UpdateUserById(id: number, data: Partial<User>): Promise<boolean>;
}