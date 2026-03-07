import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { db } from '@/lib/db';
import { getTenantIdSafe } from '@/lib/tenant-context';
import { getTenantBySlug } from '@/lib/tenant';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    let tenantId = await getTenantIdSafe();
    if (!tenantId) {
      const defaultTenant = await getTenantBySlug('default');
      tenantId = defaultTenant?.id || '';
    }
    if (!tenantId) {
      return {
        title: 'AnimoSaaS - 私域动画素材管理系统',
        description: '专业的高质量动画素材分发系统。',
      };
    }
    const config = await db.config.get(tenantId);
    return {
      title: {
        template: `%s | ${config.title || 'AnimoSaaS'}`,
        default: config.title || 'AnimoSaaS - 私域动画素材管理系统',
      },
      description: config.slogan || '专业的高质量动画素材分发系统。',
    };
  } catch {
    return {
      title: 'AnimoSaaS - 私域动画素材管理系统',
      description: '专业的高质量动画素材分发系统。',
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let primaryColor = '#00ff88';
  try {
    let tenantId = await getTenantIdSafe();
    if (!tenantId) {
      const defaultTenant = await getTenantBySlug('default');
      tenantId = defaultTenant?.id || '';
    }
    const config = tenantId ? await db.config.get(tenantId) : null;
    primaryColor = config?.themeColor || '#00ff88';
  } catch {
    // DB unavailable (build time) — use default theme color
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --brand-primary: ${primaryColor};
          }
        `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-zinc-950`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="cyber-bg" />
          <Toaster position="top-center" richColors />
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
