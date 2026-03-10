import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantIdSafe } from '@/lib/tenant-context';
import nodemailer from 'nodemailer';
import { verificationCodes } from '@/lib/verification-codes';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: '邮箱地址不能为空' }, { status: 400 });
    }

    const tenantId = await getTenantIdSafe();
    if (!tenantId) {
      return NextResponse.json({ error: '租户未找到' }, { status: 400 });
    }

    const config = await db.config.get(tenantId);

    if (!config.emailVerificationEnabled) {
      return NextResponse.json({ error: '邮箱验证未启用' }, { status: 400 });
    }

    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return NextResponse.json({ error: 'SMTP 配置不完整' }, { status: 500 });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with 10 minute expiration
    verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 465,
      secure: config.smtpSecure !== false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    // Send email
    await transporter.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: email,
      subject: `${config.title || 'AnimoSaaS'} - 邮箱验证码`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #00ff88;">邮箱验证码</h2>
          <p>您的验证码是：</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 20px;">验证码有效期为 10 分钟，请尽快使用。</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">如果这不是您的操作，请忽略此邮件。</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
  }
}
