import { Inject, Injectable } from '@nestjs/common';
import {  USER_REPOSITORY_INTERFACE, type UserRepositoryIntereface } from './interface/user.repository.interface';
import { User } from './user.model';

@Injectable()
export class UserService {
    constructor(
        @Inject(USER_REPOSITORY_INTERFACE)// tiêm cái inter vào. nestjt sẽ tự nhet thằng user repository vô
        private readonly userRepository: UserRepositoryIntereface
    ){}
    async FindFirstByOr(condition: Partial<User>[]): Promise<User | null>{
        return await this.userRepository.findUserByOr(condition);
    }
    async UpdateUser(condition: Partial<User>, data: Partial<User>): Promise<Boolean>{
        return await this.userRepository.UpdateUserBy(condition,data);
    }
    async FindFirstBy(condition: Partial<User>): Promise<User|null>{
        return await this.userRepository.FindUserBy(condition);
    }
    async createUser(data: Partial<User>): Promise<User | null>{
        return await this.userRepository.CreateUser(data);
    }
    async findValidTokenUser(email: string , token: string, time: Date): Promise<User | null>{
        return await this.userRepository.findValidTokenUser(email, token, time);
    }
}
