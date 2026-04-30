import { Global, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModel } from 'src/user/infrastructure/model/user.model';
import { STORAGE_SERVICE } from './domain/interfaces/storage.interface';
import { LocalStorageService } from './infrastructure/local-storage.service.ts';

@Global()//chỉ cần import 1 lần thằng storemodule này ở app các chỗ khác khi dùng thì ko cần import nữa
@Module({
    
    providers: [
        {
            provide: STORAGE_SERVICE,
            useClass: LocalStorageService
        }
    ],
    exports: [STORAGE_SERVICE]
})
export class StorageModule {}
