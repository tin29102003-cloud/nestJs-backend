import { User } from "../entities/user.entity";

export const  USER_REPOSITORY_INTERFACE = 'UserRepositoryIntereface';
export interface UserRepositoryIntereface{
    findUserByOrWithProvider(condition: Partial<User>[]): Promise<User | null>;
    findUserByOr(condition: Partial<User>[]): Promise<User | null> 
    FindUserById(id: number): Promise<User | null>;
    UpdateUserBy(condition: Partial<User>, data: Partial<User>): Promise<boolean>;
    FindUserBy(condition: Partial<User>):Promise<User | null>;
    CreateUser(condition: Partial<User>): Promise<User>;
    findValidTokenUser(email: string, token: string, time: Date):Promise<User | null>;
}