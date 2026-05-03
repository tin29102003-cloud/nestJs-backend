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
            if(!filePath) return;
            const physicalPath = path.join(process.cwd(),'public',filePath);//module cua path sẽ tự cvhuyeen dấu từ \\ thành /
            
            try{
                await fs.unlink(physicalPath);
                this.logger.log(`[Storage] Đã dọn dẹp file rác: ${physicalPath}`);
            }catch(error: any){
                const err = error as NodeJS.ErrnoException;
                if(err.code === 'ENOENT'){
                    return;
                }    
            throw error;
            }
    }
    async deleteManyFile(files: string[]) {
        const results = await Promise.allSettled(
            files.map(file=> this.deleteFile(file))
        );//thằng này du xóa failed cung ko băt lỗi
        results.forEach((result, index)=>{
            if(result.status === 'rejected' ){
                this.logger.warn(`Không thể xóa file ${files[index]}`,
                    result.reason?.message
                );
            }
        });//thằng này để bieert thang nào ko xoa dc
    }
}