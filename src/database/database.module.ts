import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {SequelizeModule} from '@nestjs/sequelize'
@Module({//decorator cuar nest js
    imports: [//noi khai bao cac module can dung
        SequelizeModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService)=> ({
                dialect: config.get<any>('database.dialect'),
                host: config.get<string>('database.host'),
                port: config.get<number>('database.port'),
                username: config.get<string>('database.username'),
                password: config.get<string>('database.password'),
                database: config.get<string>('database.database'),
                autoLoadModels: true,//tuw dong load cac model da dang kys  maf ko  can import thu cong
                synchronize: process.env.NODE_ENV !== 'production',
                logging: true
            })
        })
    ]
})
export class DatabaseModule {}//expor ra class rong nhung module ddc thanh modle thuc thu
