import { Injectable } from "@nestjs/common";
import { UserRepositoryIntereface } from "../interface/user.repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../user.model";
import { Op } from "sequelize";

@Injectable()// dánh dáu class này là provider  để neesst js có thể DI đc
export class UserRepository implements UserRepositoryIntereface{
    constructor(
        @InjectModel(User) //injec moddel  squelize vào class
        private readonly userModel: typeof User,){}
        async findUserByEmail(tai_khoan: string): Promise<User | null> {
            return await this.userModel.findOne({
                where: {
                    [Op.or]: [{tai_khoan: tai_khoan}, {email: tai_khoan}],
                }
            });
        }
        async FindUserById(id: number): Promise<User | null> {
            return await this.userModel.findByPk(id)
        }
}