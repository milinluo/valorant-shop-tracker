import { useEffect, useRef } from 'react';

interface WishHitEffectProps {
  skinName: string;
  onDone: () => void;
}

const PARTICLE_COLORS = ['#ffd700', '#ffb347', '#fff3b0', '#ff7b54', '#ffe066'];

/** 心愿皮肤抽中时的全屏庆祝特效：金色粒子升腾 + 中心大字提示，播放约 2.5 秒后自动消失 */
export default function WishHitEffect({ skinName, onDone }: WishHitEffectProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('span');
      p.className = 'absolute bottom-[-24px]';
      const size = 5 + Math.random() * 8;
      const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
      p.style.left = `${5 + Math.random() * 90}%`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.borderRadius = i % 3 !== 0 ? '9999px' : '3px';
      p.style.boxShadow = `0 0 10px ${color}`;
      p.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      p.style.setProperty('--rot', `${(Math.random() - 0.5) * 400}deg`);
      p.style.animation = `wish-rise ${1.3 + Math.random() * 1.1}s ease-out ${Math.random() * 0.4}s forwards`;
      frag.appendChild(p);
    }
    root.appendChild(frag);
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      <style>{`
        @keyframes wish-rise {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-78vh) translateX(var(--dx, 0)) rotate(var(--rot, 0deg)) scale(0.3); opacity: 0; }
        }
        @keyframes wish-pop {
          0% { transform: scale(0.4); opacity: 0; }
          55% { transform: scale(1.14); opacity: 1; }
          75% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes wish-glow {
          0%, 100% { text-shadow: 0 0 14px rgba(255, 200, 0, 0.65), 0 0 40px rgba(255, 170, 0, 0.4); }
          50% { text-shadow: 0 0 26px rgba(255, 220, 60, 0.95), 0 0 60px rgba(255, 170, 0, 0.7); }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute left-1/2 top-[30%] w-full -translate-x-1/2 -translate-y-1/2 px-4 text-center">
        <div
          className="text-[42px] font-black tracking-[0.2em] text-amber-300"
          style={{ animation: 'wish-pop 0.6s ease-out both, wish-glow 1.6s ease-in-out 0.5s both' }}
        >
          心愿达成！
        </div>
        <div
          className="mt-2 text-2xl font-bold text-amber-100"
          style={{ animation: 'wish-pop 0.6s ease-out 0.25s both' }}
        >
          {skinName}
        </div>
        <div
          className="mt-3 text-sm tracking-[0.3em] text-amber-200/80"
          style={{ animation: 'wish-pop 0.6s ease-out 0.45s both' }}
        >
          ✦ 恭喜在每日商店抽中许愿皮肤 ✦
        </div>
      </div>
    </div>
  );
}
