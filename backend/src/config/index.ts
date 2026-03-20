/// <reference path="../../sst-env.d.ts" />
import { Resource } from "sst";

export const CONFIG = {
    // SST/AWS SDK sẽ tự hiểu Region, nhưng mình cứ để fallback cho chắc
    REGION: process.env.AWS_REGION || 'ap-southeast-1',
    
    // Lấy trực tiếp từ Resource đã được "link" - Typesafe 100%
    TABLE_NAME: Resource.SpotifyTable.name,
    
    S3: {
        BUCKET_NAME: Resource.SpotifyMedia.name,
        URL_EXPIRATION: 300, // 5 phút cho Pre-signed URL
    },
    
    // Trong SST v3, Stage thường được quản lý ở cấp độ cao hơn, 
    // nhưng nếu cần in ra để debug thì có thể lấy qua logic của app
    STAGE: process.env.SST_STAGE || 'dev',
} as const;

// Với Resource, ông không cần check Fail-fast bằng tay nữa 
// vì nếu Resource không tồn tại, TypeScript sẽ báo đỏ ngay lúc ông gõ code!