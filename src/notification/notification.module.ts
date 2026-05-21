import { Module } from '@nestjs/common';
import { Notification_Interface } from './domain/interface/notification.interface';
import { EmailNotificationService } from './infrastructure/chanels/email-notification.service';
import { TemplateService } from './infrastructure/template/template.service';
import { TEMPLATE_INTERFACE } from './domain/interface/template.inteface';
import { NotificationRepository } from './infrastructure/repositories/notificationsytem.repository';
import { NOTIFICATION_REPOSITORY_INTERFACE } from './domain/interface/notificationsytem.interface';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationModel } from './infrastructure/model/notification.model';


@Module({
  imports: [SequelizeModule.forFeature([NotificationModel])],
  providers: [{
    provide: TEMPLATE_INTERFACE,
    useClass: TemplateService
  },{
    provide: Notification_Interface,
    useClass: EmailNotificationService
  },{
    provide: NOTIFICATION_REPOSITORY_INTERFACE,
    useClass: NotificationRepository
  }],
  exports: [Notification_Interface, TEMPLATE_INTERFACE, NOTIFICATION_REPOSITORY_INTERFACE]
})
export class NotificationModule {}
