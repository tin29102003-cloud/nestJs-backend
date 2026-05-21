import { Notification } from "src/notification/domain/entities/notification.entity";

export const NOTIFICATION_REPOSITORY_INTERFACE = Symbol('NotificationRepositoryInterface');
export interface NotificationRepositoryInterface {
    createNotification(data: Partial<Notification>): Promise<Notification>;
}