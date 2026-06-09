import { Module } from '@nestjs/common';
import { AttributeController } from './presentation/controllers/attribute.controller';
import { AttributeService } from './application/services/attribute.service';
import { AttributeRepository } from './infrastructure/repositories/attribute.repository';
import { ATTRIBUTE_REPOSITORY_INTERFACE } from './domain/interface/attribute.interface';
import { UserModule } from 'src/user/user.module';
import { AttributeModel } from './infrastructure/models/attribute.model';
import { SequelizeModule } from '@nestjs/sequelize/dist/sequelize.module';

@Module({
  imports: [
    SequelizeModule.forFeature([AttributeModel]), UserModule
  ],
  controllers: [ AttributeController],
  providers: [AttributeService, {
    provide: ATTRIBUTE_REPOSITORY_INTERFACE,
    useClass: AttributeRepository
  }],
  exports: [AttributeService]
})
export class AttributeModule {}
