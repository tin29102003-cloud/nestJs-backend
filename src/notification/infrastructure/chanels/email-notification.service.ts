import { Inject, Injectable, Logger } from "@nestjs/common";
import { NotificationInterface } from "../../domain/interface/notification.interface";
import nodemailer from 'nodemailer'
import { mailOptions } from "src/common/constants/auth.constaint";
import { NotificationType } from "src/common/constants/notification.constant";
import { TEMPLATE_INTERFACE, type TemplateServiceInterface } from "src/notification/domain/interface/template.inteface";
@Injectable()
export class EmailNotificationService implements NotificationInterface{
    private readonly logger  = new Logger(EmailNotificationService.name);
    private tranposter: nodemailer.Transporter;
    constructor(
        @Inject(TEMPLATE_INTERFACE)
        private readonly templateService: TemplateServiceInterface){
        this.tranposter = nodemailer.createTransport({
            service: 'gmail',
            auth: {user: process.env.MAIL_USER || "baodbrr@gmail.com", pass: process.env.MAIL_PASS || "zxcs cxcv dsfd edsf"},
            tls: {rejectUnauthorized: false}
        })
    }
    async send(type: NotificationType, toWho: string, subject: string,payload: Record<string, any>): Promise<boolean> {
        try {
            const htmlContent = this.templateService.compileTemplate(type, payload);
            // console.log(verifyLink);
            const mailOption: mailOptions = {
			from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
			to: toWho,
			subject: subject,
			html: htmlContent
		};
            await this.tranposter.sendMail(mailOption);
            this.logger.log(`Đã gửi email xác thực thành công tới: ${toWho}`);
            return true
        } catch (error) {
            this.logger.error(`Lỗi khi gửi email:`, error);
            throw new Error('Không thể gửi email xác thực lúc này.');
            
        }
    }
   
    
}