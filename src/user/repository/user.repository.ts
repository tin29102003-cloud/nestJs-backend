import { Injectable } from "@nestjs/common";
import { UserRepositoryIntereface } from "../interface/user.repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../user.model";
import { Op } from "sequelize";
import { AUTH_PROVIDER } from "src/common/constants/auth.constaint";

@Injectable()// dánh dáu class này là provider  để neesst js có thể DI đc
export class UserRepository implements UserRepositoryIntereface{
    constructor(
        @InjectModel(User) //injec moddel  squelize vào class
        private readonly userModel: typeof User,){}
        async findUserByEmail(tai_khoan: string): Promise<User | null> {
            return await this.userModel.findOne({
                where: {
                    [Op.or]: [{tai_khoan: tai_khoan}, {email: tai_khoan}],
                    provider: AUTH_PROVIDER.LOCAL
                }
            });
        }
        async FindUserById(id: number): Promise<User | null> {
            return await this.userModel.findByPk(id)
        }
        async UpdateUserById(id: number, data: Partial<User>): Promise<boolean> {
            const [affectedRow] = await this.userModel.update(data,{
                where: {id}
            });
            return affectedRow > 0
        }
}