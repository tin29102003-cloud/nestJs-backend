
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');//theem symbol để đăng ký vào container của nestjs

export interface IStorageService {
    saveFile(file: Express.Multer.File, fieldName: string): Promise<string>;
    deleteFile(filePath: string);
    deleteManyFile(files: string[]);
    // getFileUrl(filePath: string): string;
}