import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { FileFilterCallback } from "multer";
type  multerFile = Express.Multer.File 
export const imgageFileFilter = (
  req: Request,
  file: multerFile,
  callback: (error: Error | null, acceptFile: boolean) => void
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)'), false);
  }
  callback(null, true);
};