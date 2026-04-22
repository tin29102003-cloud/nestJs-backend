import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserService } from './application/service/user.service';
import { USER_REPOSITORY_INTERFACE } from './domain/interface/user.repository.interface';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserModel } from './infrastructure/model/user.model';
import { UserController } from './presentation/controllers/user.controller';
import { AuthModule } from 'src/auth/auth.module';



@Module({
  imports: [SequelizeModule.forFeature([UserModel])],//quản lý bảng user
  providers: [UserService,{
    provide: USER_REPOSITORY_INTERFACE,
    useClass: UserRepository
  },],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
