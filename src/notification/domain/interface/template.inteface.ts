import { NotificationType } from "src/common/constants/notification.constant"

export const TEMPLATE_INTERFACE = 'TemplateServiceInterface'
export interface TemplateServiceInterface{
    compileTemplate(templateName: NotificationType, data: any): string
} 