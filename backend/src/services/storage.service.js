import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // ej: https://pub-xxx.r2.dev o https://avatars.tudominio.com

const isR2Configured = () =>
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL;

let s3Client = null;

const getR2Client = () => {
  if (!s3Client && isR2Configured()) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true
    });
  }
  return s3Client;
};

/**
 * Sube un buffer a R2 y devuelve la URL pública.
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} key - Ruta en el bucket (ej: avatars/avatar-123.jpg)
 * @param {string} contentType - MIME type (ej: image/jpeg)
 * @returns {Promise<string>} URL pública del archivo
 */
export const uploadToR2 = async (buffer, key, contentType) => {
  const client = getR2Client();
  if (!client) {
    throw new Error('R2 no está configurado. Revisa las variables de entorno.');
  }

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  return `${baseUrl}/${key}`;
};

export { isR2Configured };
