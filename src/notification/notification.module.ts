import { Module } from '@nestjs/common';
import { Notification_Interface } from './interface/notification.interface';
import { EmailNotificationService } from './chanels/email-notification.service';
import { TemplateService } from './template/template.service';


@Module({
  providers: [TemplateService,{
    provide: Notification_Interface,
    useClass: EmailNotificationService
  }],
  exports: [Notification_Interface, TemplateService]
})
export class NotificationModule {}
