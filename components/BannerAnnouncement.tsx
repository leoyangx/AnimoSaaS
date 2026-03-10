'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone } from 'lucide-react';

interface Banner {
  id: string;
  content: string;
  link?: string;
  linkText?: string;
  bgColor: string;
  textColor: string;
  scrollSpeed?: number;
}

function MarqueeContent({ banner }: { banner: Banner }) {
  const speed = banner.scrollSpeed || 50;
  const duration = (40 * 50) / speed;

  const inner = (
    <span className="inline-flex items-center gap-6 pr-24">
      <span className="text-sm font-semibold tracking-wide">{banner.content}</span>
      {banner.link && banner.linkText && (
        <a
          href={banner.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold underline decoration-2 underline-offset-2 hover:opacity-75 transition-opacity inline-block whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {banner.linkText} →
        </a>
      )}
    </span>
  );

  return (
    <div className="marquee-wrapper">
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {inner}
        {inner}
      </div>
    </div>
  );
}

export function BannerAnnouncement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchBanners = useCallback(() => {
    fetch('/api/banners', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: Banner[]) => {
        const validated = data.map((banner) => ({
          ...banner,
          scrollSpeed:
            typeof banner.scrollSpeed === 'number' && !isNaN(banner.scrollSpeed)
              ? banner.scrollSpeed
              : 50,
        }));
        setBanners(validated);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBanners();

    // 当标签页重新变为可见时（如用户从 admin 切回前台），立即重新拉取
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBanners();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 每 60 秒轮询一次，作为兜底同步机制
    const interval = setInterval(fetchBanners, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchBanners]);

  const activeBanners = banners.filter((b) => !dismissed.has(b.id));
  if (activeBanners.length === 0) return null;

  return (
    <AnimatePresence>
      {activeBanners.map((banner) => (
        <motion.div
          key={banner.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative overflow-hidden shadow-lg"
          style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
        >
          <div className="relative flex items-center py-3 px-12 gap-3">
            <Megaphone size={18} className="flex-shrink-0 animate-pulse" />
            <MarqueeContent banner={banner} />
            <button
              onClick={() => setDismissed(new Set(dismissed).add(banner.id))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
              aria-label="关闭公告"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
