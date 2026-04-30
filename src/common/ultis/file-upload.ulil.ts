import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { FileFilterCallback } from "multer";
type  multerFile = Express.Multer.File 
export const imgageFileFilter = (
  req: Request,
  file: multerFile,
  cb: FileFilterCallback
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new BadRequestException('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)') as any, false);
  }
  cb(null, true);
};