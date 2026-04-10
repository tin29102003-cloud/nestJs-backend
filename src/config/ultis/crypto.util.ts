import crypto from 'crypto'
export class CrytoUlti{
    private static readonly ALGORITMH = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12; 
    private static  getEncryptionKey(): Buffer{
        const keyHex = process.env.ENCRYPTION_KEY;
        if(!keyHex){
            throw  new Error('CRITICAL: Thiếu biến môi trường ENCRYPTION_KEY');
        }
        const key = Buffer.from(keyHex,'hex');
        if(key.length !== 32){
            throw  new Error('Key phải 32 bytes(64 ký tự hẽx)');
        }
        return key;
    }
    static encrypt(text: string): string{
        const key = this.getEncryptionKey();
        //tạo ra một chuỗi 16 byte ngẫu nhiên cho mỗi lần mã hóa
        const iv = crypto.randomBytes(this.IV_LENGTH);
        //tạo cipher với thuật toán,key và iv
        const cipher = crypto.createCipheriv(this.ALGORITMH, key, iv);
        //mã hóa phần đàu input utf8 output là hẽ
        let encrypted  = cipher.update(text, 'utf-8','hex');
        //gợp lại thành chuỗi hex bằng cacchs ghép iv đã chuyển về hex
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();//với gcm lưu thêm authTag và quan trong nhat của gcm dùng verify xem dữ liệu có bị sửa ko
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;;
    }
    static decrypt(text: string): string{
        try {
            //tách dữ liệu ra  phần là phần iv và authtag và encrypdted
            const key = this.getEncryptionKey();
            const parts = text.split(':');
            if (parts.length !== 3) {//validate xem  có dủ 3 thành phần ko
                throw new Error('Dữ liệu không hợp lệ');
            }
            //lấy ra iv từ phần dầu đẻ giải mã
            const iv = Buffer.from(parts[0]!, 'hex');//cover là từ hẽ -> buffer
            const authTag = Buffer.from(parts[1], 'hex');
            const encryptedText = parts[2];//llaay cipertext
            const decipher = crypto.createDecipheriv(this.ALGORITMH, key, iv);//tạo decipher để giải  mã
            //giải max
            decipher.setAuthTag(authTag);//validate xem dữ liệu  có bị sưar
            let decrypted = decipher.update(encryptedText, 'hex','utf8');//giải mã phần đầu
		    decrypted += decipher.final('utf8');//giải mã phần cuoios + verify authtag
            return decrypted;
        } catch (error) {
            console.warn("Giải mã thất bại:", error);
		    throw new Error("Dữ liệu ko hợp lệ")
        }
    }
}