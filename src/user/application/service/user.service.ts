import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, Param, Put, Req } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Multer } from 'src/common/constants/storage.containt';
import { AllowedUpdateUser, SortOderType, SortOrder } from 'src/common/constants/user.constaint';
import { User } from 'src/user/domain/entities/user.entity';
import { USER_REPOSITORY_INTERFACE, type UserRepositoryIntereface } from 'src/user/domain/interface/user.repository.interface';
import { CreateUserDto, Disble2FaDto, QuickUpdateUserDto, UpdateUserDto, UserResponseDto } from 'src/user/presentation/dto/user.dto';
import bcrypt  from 'bcryptjs';
import { type IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { logger } from 'handlebars';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ROLE } from 'src/common/constants/auth.constaint';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    constructor(
        @Inject(USER_REPOSITORY_INTERFACE)// tiêm cái inter vào. nestjt sẽ tự nhet thằng user repository vô
        private readonly userRepository: UserRepositoryIntereface,
        @Inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService
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
    async FindUserBy(id: number, attributes?: string[]): Promise<User | null>{
        return await this.userRepository.FindUserById(id, attributes);
    }
    async findUserById(id: number, attributes?: string[]): Promise<User | null>{
        return await this.userRepository.FindUserById(id, attributes);
    }
    async deleteUserBy(condition: Partial<User>): Promise<boolean>{
        return await this.userRepository.deleteUser(condition);
    }
    async SearchUser(keyword: string, limit: number, offset: number,attributes?: string[]){
        return await this.userRepository.SeachUser(keyword, limit,offset,attributes)
    }
    private getPaginationParams(maxLimit: number,page?: string, limit?: string)  {
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
    //api lấy tất cả lẫn seach
    async FindAllUser(keyword?: string,page?: string, limit?: string){
        const {pageSafe, limitSafe , offset } = this.getPaginationParams(10, page, limit);
        const userAttributes = [
            'id','tai_khoan','email','ho_ten','ten_shop',
            'vai_tro','hinh','provider','provider_id',
            'khoa','dien_thoai','login_failed_count',
            'last_login_fail','is_shop','createdAt'
        ];
        const result = !keyword ?  
        await this.findAndCountUserBy(
            limitSafe, 
            offset, 
            [['createdAt', SortOrder.DESC]], 
            userAttributes
        ) : 
         await this.SearchUser(
            keyword, 
            limitSafe, 
            offset,
            userAttributes
        );
        ;
        return this.getResulData(result.rows, result.count, limitSafe, pageSafe);
        
    }
    
    async GetOneUserById(id: number): Promise<UserResponseDto | null>{
        const user = await this.userRepository.FindUserById(
            id,
            ['id','tai_khoan','email','ho_ten','ten_shop','vai_tro','hinh','provider','provider_id','khoa','dien_thoai','login_failed_count','last_login_fail','is_shop','createdAt'],
        );
        if(!user){
            throw new NotFoundException('Không tìm thấy người dùng');
        }
        return plainToInstance(UserResponseDto, user, {
            excludeExtraneousValues: true
        });
    }
    async createUserByAdmin(dto :CreateUserDto, fieldName: string, file?: Multer){
        if(!file){
            throw new BadRequestException("Bạn cần phải chọn 1 hình để tạo User");
        }
        

        if(dto.mat_khau !== dto.mat_khau_nhap_lai){
            throw new BadRequestException("Mật khẩu không trùng mật khẩu nhập lại");
        }
        const existing = await this.FindFirstByOr([{tai_khoan: dto.tai_khoan}, {email: dto.email}]);
        if(existing){
            if(existing.tai_khoan === dto.tai_khoan){
                throw  new ConflictException("Tài khoản đã tồn tại, vui lòng Nhập tài khoản khác nhá");
            }
            if(existing.email === dto.email){
                throw new ConflictException("Email đã tồn tại, vui lòng nhập email khác");
            }
        }
        
        const salt = await bcrypt.genSalt(10);
        const  hashed = await bcrypt.hash(dto.mat_khau, salt);
        let hinhUrl: string | null = null;
        try {
            hinhUrl = await this.storageService.saveFile(file, fieldName);
            const newUser = await this.createUser({
                tai_khoan: dto.tai_khoan,
                email: dto.email,
                mat_khau: hashed,
                xac_thuc_email_luc: new Date(),
                hinh: hinhUrl,
                vai_tro: dto.vai_tro
            });
            return newUser;
        } catch (error) {
           if(hinhUrl){
                 await this.storageService.deleteFile(hinhUrl).catch(()=>{
                    this.logger.warn(`Không thể xóa hình ${hinhUrl}`)
                })
           }
           throw new Error;
        }
    }
    async updateUserByAdmin(id: number,dto: UpdateUserDto, fieldName: string, file?: Multer){
        let newHinh: string | null = null
        try{
            const oldFileToDelete: string[] = [];
            const allowUpdate: AllowedUpdateUser = {};
            let shouldInvalidateToken = false;
            const user = await  this.findUserById(id);
            if(!user){
                throw new  NotFoundException("Không tìm thấy user để cập nhật")
            }
            if(dto.mat_khau){
                if(dto.mat_khau !== dto.mat_khau_nhap_lai){
                    throw new BadRequestException("Mật khẩu không trùng với mật khẩu nhập lại");
                }
                const salt = await bcrypt.genSalt(10);
                const  hashedPassword = await bcrypt.hash(dto.mat_khau, salt);
                allowUpdate.mat_khau = hashedPassword;
                shouldInvalidateToken = true;
            }
            if(user.ho_ten !== dto.ho_ten){
                allowUpdate.ho_ten = dto.ho_ten
            }
            if(user.dien_thoai !== dto.dien_thoai){
                allowUpdate.dien_thoai = dto.dien_thoai;
            }
            if(file){
                newHinh = await this.storageService.saveFile(file, fieldName);
                allowUpdate.hinh = newHinh;
                if(user.hinh){
                    oldFileToDelete.push(user.hinh);
                }
            }
            if(shouldInvalidateToken){
                allowUpdate.token_version = user.token_version + 1;
            }
            if(dto.vai_tro !== user.vai_tro){
                allowUpdate.vai_tro = dto.vai_tro;
                shouldInvalidateToken = true
            }
            if(Object.keys(allowUpdate).length > 0){
                await this.UpdateUser({id},allowUpdate);
                await this.storageService.deleteManyFile(oldFileToDelete);
                return {
                    update: true,
                    user
                    // message: `Đã cập nhật user có ID là ${user.id}`
                }
            }
            return {
                update: false,
                user
                //  message: ` Không có cập nhật gì ở User có ID là ${user.id}`
            }
        }catch(error){
            if(newHinh){
                await this.storageService.deleteFile(newHinh).catch(()=>{
                    this.logger.warn(`Không thể xóa hình ${newHinh}`)
                })
            }
            throw error;
        }
        
        
    }
    async deleteUserByAdmin(id: number,id_user: number){
        const oldFileToUnlink: string[] = []
        const user = await this.findUserById(id);
        if(!user){
            throw new NotFoundException("Người dùng không tồn tại nên không thể xóa");
        }
        if(user.id === id_user){
            throw  new BadRequestException("Bạn không thể xóa chính mình");
        }
        if(user.vai_tro === ROLE.ADMIN){
            throw  new BadRequestException("Bạn không thể xóa 1 tài khoản admin khác");
        }
        if(user.hinh){
            oldFileToUnlink.push(user.hinh);
        }
        await this.deleteUserBy({id});

        await this.storageService.deleteManyFile(oldFileToUnlink);
        
    }
    async disble2FaByAdmin(id: number, dto: Disble2FaDto){
        const userTarget = await this.findUserById(id);
        if(!userTarget){
            throw new NotFoundException("không tìm thấy người dùng này");
        }
        if(!userTarget.is_2fa_enable){
            throw new BadRequestException( "Tài khoản chưa bật xác thực 2 bước");
        }
        await this.UpdateUser({id},{
            is_2fa_enable: false,
            two_fa_secret: null,
            otp: null,
            otp_expire: null,
        })

        //cái này thêm socket io vào sau
        this.logger.log(`[AUDIT_LOG_SECURITY] Admin ID:${id} đã TẮT 2FA cho User ID:${id}. Lý do: ${dto.ly_do}`)
        return  userTarget;
    }
    async quickUpdateUserByAdmin(id: number, dto: QuickUpdateUserDto){
        const user = await this.findUserById(id);
        if(!user){ 
            throw new NotFoundException("không tìm thấy người dùng này");
        }
        const allowUpdate : Partial<User> = {}
        if(dto.khoa !== user.khoa){
            allowUpdate.khoa = dto.khoa;
            allowUpdate.token_version = user.token_version + 1
        }
        if(Object.keys(allowUpdate).length > 0){
            await this.UpdateUser({id},allowUpdate);
            return {
                update: true
            }
        }
        return {update: false}
    }
    
}
