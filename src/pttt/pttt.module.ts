import { Module } from '@nestjs/common';
import { PTTTModel } from './infrastructure/models/pttt.model';
import { SequelizeModule } from '@nestjs/sequelize/dist/sequelize.module';
import { UserModule } from 'src/user/user.module';
import { PTTTRepository } from './infrastructure/repositories/pttt.repository';
import { PTTT_REPOSITORY_INTERFACE } from './domain/interface/pttt.interface';
import { PtttService } from './application/services/pttt.service';

@Module({
    imports: [
        SequelizeModule.forFeature([PTTTModel]),UserModule
    ],
    providers: [
        PtttService,
        {
            provide: PTTT_REPOSITORY_INTERFACE,
            useClass: PTTTRepository
        }
    ],
    exports: [PtttService]
})
export class PtttModule {}
