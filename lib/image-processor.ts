import sharp from 'sharp';

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 处理图片（压缩、调整大小、转换格式）
 */
export async function processImage(
  buffer: Buffer,
  options: ImageProcessOptions = {}
): Promise<Buffer> {
  const {
    width = 1920,
    height,
    quality = 80,
    format = 'webp',
  } = options;

  let pipeline = sharp(buffer);

  // 调整大小
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // 转换格式并压缩
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 70 })
    .toBuffer();
}

/**
 * 获取图片元数据
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
  };
}

/**
 * 验证图片是否有效
 */
export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成多种尺寸的图片
 */
export async function generateImageSizes(
  buffer: Buffer,
  sizes: number[] = [300, 600, 1200]
): Promise<Map<number, Buffer>> {
  const results = new Map<number, Buffer>();

  for (const size of sizes) {
    const resized = await sharp(buffer)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    results.set(size, resized);
  }

  return results;
}

/**
 * 添加水印
 */
export async function addWatermark(
  imageBuffer: Buffer,
  watermarkText: string,
  options: {
    fontSize?: number;
    opacity?: number;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  } = {}
): Promise<Buffer> {
  const { fontSize = 24, opacity = 0.5, position = 'bottom-right' } = options;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('无法获取图片尺寸');
  }

  // 创建水印 SVG
  const textWidth = watermarkText.length * fontSize * 0.6;
  const textHeight = fontSize * 1.5;

  let x = 0;
  let y = 0;

  switch (position) {
    case 'bottom-right':
      x = metadata.width - textWidth - 20;
      y = metadata.height - textHeight - 20;
      break;
    case 'bottom-left':
      x = 20;
      y = metadata.height - textHeight - 20;
      break;
    case 'top-right':
      x = metadata.width - textWidth - 20;
      y = 20;
      break;
    case 'top-left':
      x = 20;
      y = 20;
      break;
    case 'center':
      x = (metadata.width - textWidth) / 2;
      y = (metadata.height - textHeight) / 2;
      break;
  }

  const watermarkSvg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <text
        x="${x}"
        y="${y + fontSize}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        fill="white"
        fill-opacity="${opacity}"
        stroke="black"
        stroke-width="1"
        stroke-opacity="${opacity * 0.5}"
      >${watermarkText}</text>
    </svg>
  `;

  return image
    .composite([
      {
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}
