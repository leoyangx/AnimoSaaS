import type { NextWebVitalsMetric } from 'next/app';

/**
 * Web Vitals 监控
 * 收集 LCP, FID, CLS, FCP, TTFB 等核心指标
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    const colorMap: Record<string, string> = {
      'good': '\x1b[32m',     // green
      'needs-improvement': '\x1b[33m', // yellow
      'poor': '\x1b[31m',     // red
    };

    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      TTFB: [800, 1800],
      INP: [200, 500],
    };

    const threshold = thresholds[metric.name];
    let rating = 'good';
    if (threshold) {
      if (metric.value > threshold[1]) rating = 'poor';
      else if (metric.value > threshold[0]) rating = 'needs-improvement';
    }

    console.log(
      `[Web Vitals] ${metric.name}: ${Math.round(metric.value * 100) / 100} (${rating})`
    );
  }

  // 生产环境可以发送到监控端点
  if (process.env.NODE_ENV === 'production' && typeof navigator !== 'undefined') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      startTime: metric.startTime,
      label: metric.label,
    });

    // 使用 sendBeacon 确保页面关闭时也能发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    }
  }
}
