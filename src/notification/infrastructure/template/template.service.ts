// src/modules/notification/template/template.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { NotificationType } from 'src/common/constants/notification.constant';
import { TemplateServiceInterface } from 'src/notification/domain/interface/template.inteface';

@Injectable()
export class TemplateService implements TemplateServiceInterface{
  private readonly logger = new Logger(TemplateService.name);
  constructor(){
    handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context);
    });//hàm này giúp chúng ta có thể truyền cả object vào template và sử dụng {{json data}} để in ra chuỗi JSON trong template, rất hữu ích khi cần truyền nhiều dữ liệu phức tạp vào template.
  }
  /**
   * Đọc và biên dịch file .hbs thành chuỗi HTML
   * @param templateName Tên file template (không cần đuôi .hbs)
   * @param data Object chứa dữ liệu cần truyền vào template
   */
  compileTemplate(templateName: NotificationType, data: any): string {
    try {
      // __dirname sẽ trỏ tới thư mục chứa file template.service.ts đang chạy
      // Ta đi vào thư mục 'templates' và tìm file .hbs
      const filePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      // console.log(filePath);
      // Đọc nội dung file
      const templateContent = fs.readFileSync(filePath, 'utf8');

      // Biên dịch bằng handlebars
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Trả về HTML đã được điền dữ liệu
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error(`Không thể biên dịch template ${templateName}`, error);
      throw new Error('Lỗi khi tạo nội dung giao diện email.');
    }
  }
}