import { getSession } from '@/lib/auth';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/test-email
 * 测试 SMTP 邮件发送
 */
export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, testEmail } = body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !testEmail) {
      return errorResponse('缺少必要的 SMTP 配置参数', 400);
    }

    // 创建 SMTP 传输器
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // 465端口使用SSL
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // 验证连接
    try {
      await transporter.verify();
    } catch (error: any) {
      return errorResponse(`SMTP 连接失败: ${error.message}`, 500);
    }

    // 发送测试邮件
    try {
      await transporter.sendMail({
        from: smtpFrom || smtpUser,
        to: testEmail,
        subject: 'AnimoSaaS 邮件测试',
        text: '这是一封来自 AnimoSaaS 的测试邮件。如果您收到此邮件，说明 SMTP 配置正确。',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ 邮件测试成功</h2>
            <p>这是一封来自 <strong>AnimoSaaS</strong> 的测试邮件。</p>
            <p>如果您收到此邮件，说明您的 SMTP 配置正确，邮件服务可以正常使用。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `,
      });

      return successResponse(null, `测试邮件已发送至 ${testEmail}`);
    } catch (error: any) {
      return errorResponse(`发送邮件失败: ${error.message}`, 500);
    }
  } catch (error) {
    console.error('Test email error:', error);
    return errorResponse('测试邮件发送失败', 500, error);
  }
}
