import { Injectable, Logger } from "@nestjs/common";
import { NotificationInterface } from "../interface/notification.interface";
import nodemailer from 'nodemailer'
import { TemplateService } from "../template/template.service";
import { mailOptions } from "src/common/constants/auth.constaint";
import { NotificationType } from "src/common/constants/notification.constant";
@Injectable()
export class EmailNotificationService implements NotificationInterface{
    private readonly logger  = new Logger(EmailNotificationService.name);
    private tranposter: nodemailer.Transporter;
    constructor(private readonly templateService: TemplateService){
        this.tranposter = nodemailer.createTransport({
            service: 'gmail',
            auth: {user: process.env.MAIL_USER || "baodbrr@gmail.com", pass: process.env.MAIL_PASS || "zxcs cxcv dsfd edsf"},
            tls: {rejectUnauthorized: false}
        })
    }
    async send(type: NotificationType, toWho: string, payload: Record<string, any>): Promise<boolean> {
        try {
            const htmlContent = this.templateService.compileTemplate(type, payload);
            // console.log(verifyLink);
            const mailOption: mailOptions = {
			from: `"Thương mại điện tử KADU" <${process.env.MAIL_USER}>`,
			to: toWho,
			subject: 'Thư xác định tài khoản của  tmdt  KADU',
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