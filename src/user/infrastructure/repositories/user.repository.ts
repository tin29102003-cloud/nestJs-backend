import { Injectable } from "@nestjs/common";
import { UserRepositoryIntereface } from "../../domain/interface/user.repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { AUTH_PROVIDER } from "src/common/constants/auth.constaint";
import { UserModel } from "../model/user.model";
import { User } from "src/user/domain/entities/user.entity";


@Injectable()// dánh dáu class này là provider  để neesst js có thể DI đc
export class UserRepository implements UserRepositoryIntereface{
    constructor(
        @InjectModel(UserModel) //injec moddel  squelize vào class
        private readonly userModel: typeof UserModel,){}
        private ToEntity(model: UserModel){
            return new User(model.toJSON());
        }
        async findUserByOr(condition: Partial<User>[]): Promise<User | null> {
            const user =  await this.userModel.findOne({
                where: {
                    [Op.or] : condition,
                    provider: AUTH_PROVIDER.LOCAL
                }
            })
            return  user ? this.ToEntity(user): null//chuyeen usermodel thanh entity
        }
        async FindUserById(id: number): Promise<User | null> {
            const user =  await this.userModel.findByPk(id);
             return  user ? this.ToEntity(user): null
        }
        async FindUserBy(condition: Partial<User>): Promise<User | null> {
            const user = await this.userModel.findOne({
                where: condition
            })
            return  user ? this.ToEntity(user): null
        }
        async UpdateUserBy(condition: Partial<User>, data: Partial<User>): Promise<boolean> {
            const [affectedRow] = await this.userModel.update(data,{
                where: condition
            });
            return affectedRow > 0
        }
        async CreateUser(data: Partial<User>): Promise<User> {
            const user =  await this.userModel.create(data);
            return this.ToEntity(user);
        }
        async findValidTokenUser(email: string, token: string, time: Date): Promise<User | null> {
           const user =  await this.userModel.findOne({
                where: {
                    email,
                    token, 
                    provider: AUTH_PROVIDER.LOCAL,
                    token_expire: {[Op.gt]: time}
                }
           });
         return  user ? this.ToEntity(user): null
       }  
}