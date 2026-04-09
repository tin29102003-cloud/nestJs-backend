import { Injectable } from "@nestjs/common";
import { UserRepositoryIntereface } from "../interface/user.repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../user.model";
import { Op, WhereOptions } from "sequelize";
import { AUTH_PROVIDER } from "src/common/constants/auth.constaint";

@Injectable()// dánh dáu class này là provider  để neesst js có thể DI đc
export class UserRepository implements UserRepositoryIntereface{
    constructor(
        @InjectModel(User) //injec moddel  squelize vào class
        private readonly userModel: typeof User,){}
        async findUserByOr(condition: Partial<User>[]): Promise<User | null> {
            return await this.userModel.findOne({
                where: {
                    [Op.or] : condition,
                    provider: AUTH_PROVIDER.LOCAL
                }
            })
        }
        async FindUserById(id: number): Promise<User | null> {
            return await this.userModel.findByPk(id);
        }
        async FindUserBy(condition: WhereOptions<User>): Promise<User | null> {
            return await this.userModel.findOne({
                where: condition
            })
        }
        async UpdateUserBy(condition: Partial<User>, data: Partial<User>): Promise<boolean> {
            const [affectedRow] = await this.userModel.update(data,{
                where: condition
            });
            return affectedRow > 0
        }
        async CreateUser(data: Partial<User>): Promise<User> {
            return  await this.userModel.create(data);
        }
        async findValidTokenUser(email: string, token: string, time: Date): Promise<User | null> {
           return await this.userModel.findOne({
                where: {
                    email,
                    token, 
                    provider: AUTH_PROVIDER.LOCAL,
                    token_expire: {[Op.gt]: time}
                }
           });
       }

        
        
}