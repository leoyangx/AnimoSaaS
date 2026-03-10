import axios from 'axios';
import { SiteConfig } from './types';

/**
 * AnimoSaaS Storage Engine
 * Handles direct link resolution for various cloud drives
 */
export class StorageEngine {
  private config: SiteConfig;

  constructor(config: SiteConfig) {
    this.config = config;
  }

  /**
   * Normalize path to avoid double slashes or missing slashes
   */
  private normalizePath(path: string): string {
    return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  /**
   * Resolve full path considering rootPath
   */
  private resolveFullPath(filePath: string, rootPath: string = '/'): string {
    const normalizedRoot = this.normalizePath(rootPath);
    const normalizedFile = this.normalizePath(filePath);

    // 如果文件路径已经以根路径开头，则不再拼接
    if (normalizedFile.startsWith(normalizedRoot) && normalizedRoot !== '/') {
      return normalizedFile;
    }

    return this.normalizePath(`${normalizedRoot}/${normalizedFile}`);
  }

  /**
   * Get direct download URL from AList
   */
  async getAListDirectUrl(filePath: string): Promise<{ url: string | null; error?: string }> {
    const baseUrl = this.config.alistUrl?.trim();
    const token = this.config.alistToken?.trim();
    const rootPath = this.config.alistRoot || '/';

    if (!baseUrl || !token) {
      return { url: null, error: 'AList 配置不完整：缺少 URL 或 Token' };
    }

    const fullPath = this.resolveFullPath(filePath.trim(), rootPath);
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/fs/get`;

    try {
      const res = await axios.post(
        apiUrl,
        {
          path: fullPath,
          refresh: true,
        },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (res.data?.code === 200 && res.data?.data?.raw_url) {
        return { url: res.data.data.raw_url };
      } else {
        const msg = res.data?.message || '未知 AList 错误';
        return { url: null, error: `AList API 错误: ${msg}` };
      }
    } catch (error: any) {
      return { url: null, error: `AList 连接失败: ${error.message}` };
    }
  }

  /**
   * List files from AList
   */
  async listAListFiles(subPath: string = ''): Promise<any[] | null> {
    const baseUrl = this.config.alistUrl?.trim();
    const token = this.config.alistToken?.trim();
    const rootPath = this.config.alistRoot || '/';

    if (!baseUrl || !token) return null;

    const fullPath = this.resolveFullPath(subPath, rootPath);
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/fs/list`;

    try {
      const res = await axios.post(
        apiUrl,
        {
          path: fullPath,
          page: 1,
          per_page: 100,
          refresh: false,
        },
        {
          headers: { Authorization: token },
        }
      );

      if (res.data?.code === 200 && res.data?.data?.content) {
        return res.data.data.content;
      }
      return null;
    } catch (error: any) {
      return null;
    }
  }

  async resolveDownloadUrl(
    fileId: string,
    provider: string
  ): Promise<{ url: string; error?: string }> {
    if (provider === 'AList') {
      const result = await this.getAListDirectUrl(fileId);
      if (result.url) return { url: result.url };
      if (result.error) return { url: fileId, error: result.error };
    }

    // 123Pan / Juhe: 当前直接返回原始链接，由前端或客户端处理
    return { url: fileId };
  }

  async resolveThumbnailUrl(fileId: string, provider: string): Promise<string> {
    if (fileId.startsWith('http')) {
      return fileId;
    }

    if (provider === 'AList' && this.config.alistUrl) {
      const baseUrl = this.config.alistUrl;
      const rootPath = this.config.alistRoot || '/';
      const fullPath = this.resolveFullPath(fileId, rootPath);
      const encodedPath = fullPath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      return `${baseUrl.replace(/\/$/, '')}/d/${encodedPath.replace(/^\//, '')}?type=thumb`;
    }

    return `https://picsum.photos/seed/${fileId}/400/600`;
  }
}
