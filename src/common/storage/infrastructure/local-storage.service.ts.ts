import path from 'path';
import fs from 'fs/promises';
import { IStorageService } from '../domain/interfaces/storage.interface';
import { InternalServerErrorException, Logger } from '@nestjs/common';
export class LocalStorageService implements IStorageService {
    private readonly logger = new Logger(LocalStorageService.name);
    private generateUniqueName(file: Express.Multer.File, fieldName: string, folderPath: string): string{
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E5);
            const ext = path.extname(file.originalname);
            const fileName = `${fieldName}-${uniqueSuffix}${ext}`;
            return path.join(folderPath, fileName);
           
    }
    private processFilePath(filePath: string): string | null {
        if (filePath) {
            const pathParts = filePath.split('public');
            const relativePath = pathParts[1]; 
            if (relativePath) {
                return relativePath.replace(/\\/g, '/');
            }
        }
        return null;  
    }
    private getPhysicalPath(fileUrl: string): string {
        // Hàm path.join sẽ tự động thêm "public" và lo việc đổi dấu / hay \ cho bạn
        return path.join(process.cwd(), 'public', fileUrl);
    }
    async saveFile(file: Express.Multer.File, fieldName: string): Promise<string> {
        let uploadPath = '';
        switch (fieldName) {
            case 'hinh_user':
                uploadPath = path.join(process.cwd(), 'public', 'user', 'img');//process.cwd() trả về đường dẫn gốc của dự án, sau đó kết hợp với các thư mục con để tạo thành đường dẫn đầy đủ
                break;
            case 'hinh_dm':
                uploadPath = path.join(process.cwd(), 'public', 'danh-muc', 'img');
                break;
            case 'hinh_th':
                uploadPath = path.join(process.cwd(), 'public', 'thuong-hieu', 'img');
                break;
            case 'hinh_tin':
                uploadPath = path.join(process.cwd(), 'public', 'tin-tuc', 'img');
                break;
            case 'hinh_sp':
                uploadPath = path.join(process.cwd(), 'public', 'san-pham', 'img');
                break;
            case 'hinh_banner':
                uploadPath = path.join(process.cwd(), 'public', 'banner', 'img');
                break;
            case 'hinh_dg':
                uploadPath = path.join(process.cwd(), 'public', 'danh-gia', 'img');
                break;
            case 'hinh_pttt':
                uploadPath = path.join(process.cwd(), 'public', 'pttt', 'img');
                break;
            default:
                if (fieldName.startsWith('hinh_bien_the_')) {
                    uploadPath = path.join(process.cwd(), 'public', 'san-pham', 'img-bien-the');
                } else {
                    uploadPath = path.join(process.cwd(), 'public', 'img');
                }  
                break; 
        }
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            const fullPath = this.generateUniqueName(file,fieldName,uploadPath);
            await fs.writeFile(fullPath, file.buffer);// lưu file từ RAM (buffer) xuống ổ cứng 
            const finalPath = this.processFilePath(fullPath);
            if(!finalPath){
                throw new Error("Lỗi định dạng đường dẫn");
            } 
            return finalPath;
        } catch (error) {
            throw new InternalServerErrorException("Lỗi khi lưu file xuống hệ thống");
        }
    }
    async deleteFile(filePath: string):Promise<void> {
        try {
            if(!filePath) return;
            const physicalPath = path.join(process.cwd(),'public',filePath);//module cua path sẽ tự cvhuyeen dấu từ \\ thành /
            await fs.unlink(physicalPath);
            this.logger.log(`[Storage] Đã dọn dẹp file rác: ${physicalPath}`);
            
        } catch (error) {
            this.logger.error(`[Storage] Không thể xóa file: ${filePath}`, error)
        }
    }
}