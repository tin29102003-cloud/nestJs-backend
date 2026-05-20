import { Global, Module } from '@nestjs/common';
import { ChatGateway } from './presentation/chat.gateway';
import { REALTIME_SERVICE } from './domain/realtime.interface';
import { SystemGateway } from './infrastructure/system.gateway';
@Global()
@Module({
    providers: [ChatGateway,
        {
            provide: REALTIME_SERVICE,
            useClass: SystemGateway
        }
    ],
    exports : [REALTIME_SERVICE]
})
export class RealtimeModule {
    
}
