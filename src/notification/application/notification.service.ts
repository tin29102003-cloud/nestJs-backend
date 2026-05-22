import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_INTERFACE, type NotificationRepositoryInterface } from '../domain/interface/notificationsytem.interface';
import { Notification } from '../domain/entities/notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY_INTERFACE)
        private readonly notificationService: NotificationRepositoryInterface
    ){
        
    }
    async createNotification(data: Partial<Notification>): Promise<Notification>{
        return this.notificationService.createNotification(data);
    }

}
