import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse } from '@/lib/api-response';
import {
  exportToExcelBuffer,
  exportToCSVBuffer,
  formatDateForExport,
  formatBooleanForExport,
} from '@/lib/export';

export async function GET(req: Request) {
  try {
    // 验证管理员权限
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // assets, users, logs, downloads
    const format = searchParams.get('format') || 'xlsx'; // xlsx, csv

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'assets':
        const assets = await prisma.asset.findMany({
          where: { tenantId, deletedAt: null },
          include: { assetCategory: true },
          orderBy: { createdAt: 'desc' },
        });

        data = assets.map((asset) => ({
          标题: asset.title,
          描述: asset.description || '',
          分类: asset.assetCategory?.name || '未分类',
          标签: asset.tags.join(', '),
          下载次数: asset.downloadCount,
          存储提供商: asset.storageProvider,
          创建时间: formatDateForExport(asset.createdAt),
        }));

        filename = `资产列表_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        const users = await prisma.user.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });

        data = users.map((user) => ({
          邮箱: user.email,
          角色: user.role,
          状态: formatBooleanForExport(!user.disabled),
          最后登录: formatDateForExport(user.lastLogin),
          IP地址: user.ip || '',
          城市: user.city || '',
          注册时间: formatDateForExport(user.createdAt),
        }));

        filename = `用户列表_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'logs':
        const logs = await prisma.adminLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 1000, // 限制最近1000条
        });

        data = logs.map((log) => ({
          操作: log.action,
          管理员: log.adminEmail,
          详情: log.details || '',
          时间: formatDateForExport(log.createdAt),
        }));

        filename = `操作日志_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'downloads':
        const downloads = await prisma.downloadLog.findMany({
          where: { tenantId },
          include: { asset: true },
          orderBy: { createdAt: 'desc' },
          take: 5000, // 限制最近5000条
        });

        data = downloads.map((log) => ({
          资产标题: log.asset.title,
          用户ID: log.userId || '匿名',
          下载时间: formatDateForExport(log.createdAt),
        }));

        filename = `下载日志_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'codes':
        const codes = await prisma.invitationCode.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });

        data = codes.map((code) => ({
          邀请码: code.code,
          状态: code.status === 'unused' ? '未使用' : '已使用',
          使用者: code.usedBy || '',
          创建时间: formatDateForExport(code.createdAt),
        }));

        filename = `邀请码列表_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return errorResponse('不支持的导出类型', 400);
    }

    if (data.length === 0) {
      return errorResponse('没有数据可导出', 400);
    }

    // 生成文件
    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      buffer = exportToCSVBuffer(data);
      contentType = 'text/csv;charset=utf-8';
      fileExtension = 'csv';
    } else {
      buffer = exportToExcelBuffer(data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}.${fileExtension}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return errorResponse('导出失败', 500, error);
  }
}
