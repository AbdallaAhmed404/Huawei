const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

// دالة حذف الملفات - هنستخدمها لما نمسح منتج من الداتا بيز
const deleteFileFromR2 = async (fileUrl) => {
    if (!fileUrl || !fileUrl.includes(R2_PUBLIC_DOMAIN)) return;
    const key = fileUrl.replace(`${R2_PUBLIC_DOMAIN}/`, '');
    try {
        await R2.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }));
    } catch (error) {
        console.error(`❌ Error deleting ${key}:`, error.message);
    }
};

module.exports = { deleteFileFromR2 };