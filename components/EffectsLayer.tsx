import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

export interface EffectsLayerHandle {
  spawnParticles: (x: number, y: number, color: string, count?: number) => void;
  triggerShake: () => void;
}

interface EffectsLayerProps {
  onShakeChange?: (isShaking: boolean) => void;
}

export const EffectsLayer = forwardRef<EffectsLayerHandle, EffectsLayerProps>(
  ({ onShakeChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number>(0);

    // パーティクル生成
    const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 12) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 3 + Math.random() * 5;
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // 少し上に飛ばす
          size: 4 + Math.random() * 6,
          color,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
        });
      }
      particlesRef.current.push(...newParticles);
    }, []);

    // 画面シェイク
    const triggerShake = useCallback(() => {
      onShakeChange?.(true);
      setTimeout(() => onShakeChange?.(false), 300);
    }, [onShakeChange]);

    // 外部から呼び出せるように公開
    useImperativeHandle(ref, () => ({
      spawnParticles,
      triggerShake,
    }), [spawnParticles, triggerShake]);

    // パーティクルアニメーションループ
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      };

      resize();
      window.addEventListener('resize', resize);

      const animate = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        particlesRef.current = particlesRef.current.filter((p) => {
          // 物理更新
          p.vy += 0.3; // 重力
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.016 / p.maxLife;
          p.rotation += p.rotationSpeed;
          p.vx *= 0.98;
          p.vy *= 0.98;

          if (p.life <= 0) return false;

          // 描画
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.life; 
          
          // 星形パーティクル
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = p.size;
          const innerRadius = p.size * 0.5;
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            if (i === 0) {
              ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            } else {
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
          }
          ctx.closePath();
          ctx.fill();

          // グロー効果
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.restore();
          return true;
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-40"
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);

EffectsLayer.displayName = 'EffectsLayer';
