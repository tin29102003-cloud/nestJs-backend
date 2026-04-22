import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { User } from 'src/user/domain/entities/user.entity';
import { USER_REPOSITORY_INTERFACE, type UserRepositoryIntereface } from 'src/user/domain/interface/user.repository.interface';
import { UserResponseDto } from 'src/user/presentation/dto/user.dto';


@Injectable()
export class UserService {
    constructor(
        @Inject(USER_REPOSITORY_INTERFACE)// tiêm cái inter vào. nestjt sẽ tự nhet thằng user repository vô
        private readonly userRepository: UserRepositoryIntereface
    ){}
    async FindFirstByOr(condition: Partial<User>[]): Promise<User | null>{
        return await this.userRepository.findUserByOr(condition);
    }
    async FindFirstByOrWithProvider(condition: Partial<User>[]): Promise<User | null>{
        return await this.userRepository.findUserByOrWithProvider(condition);
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
    async findAndCountUserBy( limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<User>,): Promise<{rows: User[] , count: number,}>{
        return await this.userRepository.findAndCountUserBy(limit, offset, order, attributes, condition);
    }
    private getPaginationParams(maxLimit: number,page?: string, limit?: string )  {
        const pageSafe = Math.max(1, Number(page) || 1);
        const limitSafe = Math.max(1, Number(limit) || maxLimit);
        return {
            pageSafe,
            limitSafe,
            offset: (pageSafe - 1) * limitSafe
        };
    }
    private getResulData(rows: User[],totalItems: number, limit: number, page: number) {
        const totalPages = Math.ceil(totalItems / limit);
        const data = rows.map(row =>
            plainToInstance(UserResponseDto, row, {
                excludeExtraneousValues: true
            })//dùng class-transformer để chuyển đổi từ entity sang dto, excludeExtraneousValues để chỉ lấy những trường có trong dto mà thôi
        );
        return {
            data,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        }
    }
    async FindAllUser(page?: string, limit?: string){
        const {pageSafe, limitSafe , offset } = this.getPaginationParams(10, page, limit);
        const result = await this.findAndCountUserBy(
            limitSafe, 
            offset, 
            [['createdAt', SortOrder.DESC]], 
            ['id','tai_khoan','email','ho_ten','ten_shop','vai_tro','hinh','provider','provider_id','khoa','dien_thoai','login_failed_count','last_login_fail','is_shop','createdAt']
        );
        return this.getResulData(result.rows, result.count, limitSafe, pageSafe);
        
    }
}
