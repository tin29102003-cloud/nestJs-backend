import { Module } from '@nestjs/common';
import { BannerModel } from './infrastructure/models/banner.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { BannerRepository } from './infrastructure/repositories/banner.repository';
import { BANNER_REPOSITORY_INTERFACE } from './domain/interface/banner.interface';
import { BannerController } from './presentation/controllers/banner.controller';
import { BannerService } from './application/services/banner.service';
import { UserModule } from 'src/user/user.module';//caanf cos usermodel de lay su dung dc jwtauthguard


@Module({
    imports: [SequelizeModule.forFeature([BannerModel]), UserModule],
    providers: [BannerService,
        {
            provide: BANNER_REPOSITORY_INTERFACE,
            useClass: BannerRepository
        }
    ],
    exports: [BannerService],
    controllers: [BannerController],
})
export class BannerModule {
    
}
