import { fileUploadSchema } from './validators';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  archive: 100 * 1024 * 1024, // 100MB
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  fileType?: 'image' | 'video' | 'archive';
}

/**
 * 验证文件
 */
export function validateFile(
  filename: string,
  mimetype: string,
  size: number
): FileValidationResult {
  // 获取文件类型
  const fileType = getFileType(mimetype);
  if (!fileType) {
    return { valid: false, error: '不支持的文件类型' };
  }

  // 验证 MIME 类型
  if (!ALLOWED_MIME_TYPES[fileType].includes(mimetype)) {
    return { valid: false, error: `不支持的${fileType}类型` };
  }

  // 验证文件大小
  if (size > MAX_FILE_SIZES[fileType]) {
    const maxSizeMB = MAX_FILE_SIZES[fileType] / 1024 / 1024;
    return {
      valid: false,
      error: `文件大小超过限制（最大${maxSizeMB}MB）`,
    };
  }

  // 验证文件扩展名
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.webm', '.mov'],
    archive: ['.zip', '.rar', '.7z'],
  };

  if (!allowedExts[fileType].includes(ext)) {
    return { valid: false, error: '文件扩展名不匹配' };
  }

  // 清理文件名（防止路径遍历攻击）
  const sanitizedFilename = sanitizeFilename(filename);

  return { valid: true, sanitizedFilename, fileType };
}

/**
 * 清理文件名
 */
export function sanitizeFilename(filename: string): string {
  // 移除路径分隔符和特殊字符
  const basename = path.basename(filename);
  const ext = path.extname(basename);
  const name = basename.slice(0, -ext.length);

  // 只保留字母、数字、下划线、连字符、中文字符
  const sanitized = name.replace(/[^\w\u4e00-\u9fa5-]/g, '_');

  // 生成唯一文件名
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');

  return `${sanitized}_${timestamp}_${random}${ext}`;
}

/**
 * 获取文件类型
 */
export function getFileType(mimetype: string): 'image' | 'video' | 'archive' | null {
  if (ALLOWED_MIME_TYPES.image.includes(mimetype)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimetype)) return 'video';
  if (ALLOWED_MIME_TYPES.archive.includes(mimetype)) return 'archive';
  return null;
}

/**
 * 验证文件扩展名是否匹配 MIME 类型
 */
export function validateMimeExtensionMatch(filename: string, mimetype: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const fileType = getFileType(mimetype);

  if (!fileType) return false;

  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
  };

  const expectedExts = mimeToExt[mimetype];
  return expectedExts ? expectedExts.includes(ext) : false;
}

/**
 * 计算文件哈希
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
