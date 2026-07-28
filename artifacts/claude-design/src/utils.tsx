import React from 'react';

export function css(s: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  s.split(';').forEach(rule => {
    const colonIdx = rule.indexOf(':');
    if (colonIdx < 0) return;
    const prop = rule.slice(0, colonIdx).trim();
    const val = rule.slice(colonIdx + 1).trim();
    if (!prop || !val) return;
    const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    obj[camelProp] = val;
  });
  return obj as React.CSSProperties;
}

// The stick figure mascot used throughout the app
export function ChopMascot({ scale = 1.3, animation = 'pipBounce 2.2s ease-in-out infinite', color = '#201E2E' }: { scale?: number; animation?: string; color?: string }) {
  const w = Math.round(64 * scale);
  const h = Math.round(90 * scale);
  return (
    <div style={{ width: w + 'px', height: h + 'px', position: 'relative', flexShrink: 0, animation }}>
      <div style={{ position: 'relative', width: '64px', height: '90px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div style={{ position: 'absolute', top: 0, left: '18px', width: '28px', height: '28px', borderRadius: '50%', background: 'transparent', border: `4px solid ${color}` }}></div>
        <div style={{ position: 'absolute', top: '28px', left: '30px', width: '4px', height: '24px', borderRadius: '2px', background: color }}></div>
        <div style={{ position: 'absolute', top: '26px', left: '12px', width: '20px', height: '4px', borderRadius: '2px', background: color }}></div>
        <div style={{ position: 'absolute', top: '26px', left: '32px', width: '20px', height: '4px', borderRadius: '2px', background: color }}></div>
        <div style={{ position: 'absolute', top: '52px', left: '6px', width: '26px', height: '4px', borderRadius: '2px', background: color, transformOrigin: 'right center', transform: 'rotate(-35deg)' }}></div>
        <div style={{ position: 'absolute', top: '52px', left: '32px', width: '26px', height: '4px', borderRadius: '2px', background: color, transformOrigin: 'left center', transform: 'rotate(35deg)' }}></div>
      </div>
    </div>
  );
}
