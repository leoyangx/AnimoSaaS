import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await req.json();

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${config.title}" <${config.smtpUser}>`,
      to: (session as any).email,
      subject: 'SMTP 测试邮件',
      text: '这是一封来自 AnimoSaaS 后台的测试邮件，证明您的 SMTP 配置正确。',
      html: '<b>这是一封来自 AnimoSaaS 后台的测试邮件</b><p>证明您的 SMTP 配置正确。</p>',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
