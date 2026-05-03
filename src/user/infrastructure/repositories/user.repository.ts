import { Injectable } from "@nestjs/common";
import { UserRepositoryIntereface } from "../../domain/interface/user.repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { FindAttributeOptions, Op, Order, WhereOptions } from "sequelize";
import { AUTH_PROVIDER } from "src/common/constants/auth.constaint";
import { UserModel } from "../model/user.model";
import { User } from "src/user/domain/entities/user.entity";
import { SortOderType } from "src/common/constants/user.constaint";


@Injectable()// dánh dáu class này là provider  để neesst js có thể DI đc
export class UserRepository implements UserRepositoryIntereface{
    constructor(
        @InjectModel(UserModel) //injec moddel  squelize vào class
        private readonly userModel: typeof UserModel,){}
        private ToEntity(model: UserModel){
            return new User(model.toJSON());
        }
        private buildQuery(options: {
            limit: number;
            offset: number;
            condition?: WhereOptions<User> | Partial<User>;
            order?: Order;
            attributes?: FindAttributeOptions;
        }) {
            return {
                where: options.condition ?? {},
                limit: options.limit,
                offset: options.offset,
                order: options.order,
                attributes: options.attributes
            };
        }
        async findUserByOrWithProvider(condition: Partial<User>[]): Promise<User | null> {
            const user =  await this.userModel.findOne({
                where: {
                    [Op.or] : condition,
                    provider: AUTH_PROVIDER.LOCAL
                }
            })
            return  user ? this.ToEntity(user): null//chuyeen usermodel thanh entity
        }
        async findUserByOr(condition: Partial<User>[]): Promise<User | null> {
            const user =  await this.userModel.findOne({
                where: {
                    [Op.or] : condition
                }
            })
            return  user ? this.ToEntity(user): null//chuyeen usermodel thanh entity
        }
        async FindUserById(id: number, attributes?: string[]): Promise<User | null> {
            const queryOptions: {
                where: { id: number };
                attributes?: FindAttributeOptions} 
                = {
                    where: { id }
                }
            if (attributes && attributes.length > 0) {
                queryOptions.attributes = attributes;
            }
            const user =  await this.userModel.findOne(queryOptions);
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
      
        async findAndCountUserBy(limit: number, offset: number, order?: [string, SortOderType][], attributes?: string[],condition?: Partial<User>): Promise<{ rows: User[]; count: number; }> {
            const queryOptions = this.buildQuery({
                limit : limit,
                offset: offset,
                condition: condition
            })
            if(order &&  order.length > 0){
                queryOptions.order = order;
            }
            if(attributes && attributes.length > 0){
                queryOptions.attributes = attributes
            }

            const { rows, count } = await this.userModel.findAndCountAll(queryOptions);
            return { rows:  rows.map((row) => this.ToEntity(row)) , count };
        }
        async deleteUser(condition: Partial<User>): Promise<boolean> {
            const deleteCount = await this.userModel.destroy({
                where: condition
            })
            return deleteCount > 0
        }
        async SeachUser(keyword: string, limit: number, offset: number, attributes?: string[]): Promise<{ rows: User[]; count: number; }> {
            const query = this.buildQuery({
                limit,
                offset,
                condition: {
                    [Op.or]: [
                        { ho_ten: { [Op.like]: `%${keyword}%` } },
                        { email: { [Op.like]: `%${keyword}%` } }
                    ]
                },
                
            })
            if(attributes &&  attributes.length > 0){
                query.attributes = attributes;
            }
            const {rows, count} = await this.userModel.findAndCountAll(query);
            return {
                rows: rows.map((row)=> this.ToEntity(row)), 
                count
            }
            
        }
}
        
