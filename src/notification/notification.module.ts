import { Module } from '@nestjs/common';
import { Notification_Interface } from './domain/interface/notification.interface';
import { EmailNotificationService } from './infrastructure/chanels/email-notification.service';
import { TemplateService } from './infrastructure/template/template.service';
import { TEMPLATE_INTERFACE } from './domain/interface/template.inteface';


@Module({
  providers: [{
    provide: TEMPLATE_INTERFACE,
    useClass: TemplateService
  },{
    provide: Notification_Interface,
    useClass: EmailNotificationService
  }],
  exports: [Notification_Interface, TEMPLATE_INTERFACE]
})
export class NotificationModule {}
