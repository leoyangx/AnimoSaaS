import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
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

export const metadata: Metadata = {
  title: 'AnimoSaaS - 专业动画素材管理系统',
  description: '专为动画工作室打造的私域素材分发门户',
};

import { getSettings } from '@/lib/settings-service';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const primaryColor = settings.system.primaryColor || '#00ff88';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
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
