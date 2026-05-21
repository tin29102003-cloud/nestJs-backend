import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { NotificationRepositoryInterface } from "src/notification/domain/interface/notificationsytem.interface";
import { NotificationModel } from "../model/notification.model";
import { Notification } from "src/notification/domain/entities/notification.entity";

@Injectable()
export class NotificationRepository implements NotificationRepositoryInterface {
    constructor(
        @InjectModel(NotificationModel)
        private readonly notificationModel: typeof NotificationModel
    ){   
    }
    private ToEntity(model: NotificationModel){
        return new Notification(model.toJSON())
    }
    async createNotification(data: Partial<Notification>): Promise<Notification> {
        const notification = await this.notificationModel.create(data);
        return this.ToEntity(notification);
    }
}