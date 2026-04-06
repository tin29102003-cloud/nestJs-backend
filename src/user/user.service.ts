import { Inject, Injectable } from '@nestjs/common';
import {  USER_REPOSITORY_INTERFACE, type UserRepositoryIntereface } from './interface/user.repository.interface';
import { User } from './user.model';

@Injectable()
export class UserService {
    constructor(
        @Inject(USER_REPOSITORY_INTERFACE)// tiêm cái inter vào. nestjt sẽ tự nhet thằng user repository vô
        private readonly userRepository: UserRepositoryIntereface
    ){}
    async FindUserToLogin(tai_khoan: string): Promise<User | null>{
        return await this.userRepository.findUserByEmail(tai_khoan);
    }
    
}
