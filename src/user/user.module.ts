import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { USER_REPOSITORY_INTERFACE } from './interface/user.repository.interface';
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [SequelizeModule.forFeature([User])],//quản lý bảng user
  providers: [UserService,{
    provide: USER_REPOSITORY_INTERFACE,
    useClass: UserRepository
  },],
  exports: [UserService]
})
export class UserModule {}
