import { NotificationType } from "src/common/constants/notification.constant"

export const  Notification_Interface = 'NotificationInterface'
export interface NotificationInterface{
    send(type : NotificationType,toWho: string, subject: string,payload: Record<string, any>): Promise<boolean>
}