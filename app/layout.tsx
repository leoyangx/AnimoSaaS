import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { db } from '@/lib/db';
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
  const config = await db.config.get();
  return {
    title: {
      template: `%s | ${config.title || 'AnimoSaaS'}`,
      default: config.title || 'AnimoSaaS - 私域动画素材管理系统',
    },
    description: config.slogan || '专业的高质量动画素材分发系统。',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await db.config.get();
  const primaryColor = config.themeColor || '#00ff88';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
          :root {
            --brand-primary: ${primaryColor};
          }
        `}} />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-zinc-950`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="cyber-bg" />
          <Toaster position="top-center" richColors />
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
