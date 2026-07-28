// @ts-nocheck
import React from 'react';
import { css } from '../utils';

function SmallChop() {
  return (
    <div style={{ width: 45, height: 63, position: 'relative', animation: 'pipCelebrate 1.6s ease-in-out infinite' }}>
      <div style={{ position: 'relative', width: 64, height: 90, transform: 'scale(0.7)', transformOrigin: 'top left' }}>
        <div style={{ position: 'absolute', top: 0, left: 18, width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '4px solid #201E2E' }} />
        <div style={{ position: 'absolute', top: 28, left: 30, width: 4, height: 24, borderRadius: 2, background: '#201E2E' }} />
        <div style={{ position: 'absolute', top: 26, left: 12, width: 20, height: 4, borderRadius: 2, background: '#201E2E' }} />
        <div style={{ position: 'absolute', top: 26, left: 32, width: 20, height: 4, borderRadius: 2, background: '#201E2E' }} />
        <div style={{ position: 'absolute', top: 52, left: 6, width: 26, height: 4, borderRadius: 2, background: '#201E2E', transformOrigin: 'right center', transform: 'rotate(-35deg)' }} />
        <div style={{ position: 'absolute', top: 52, left: 32, width: 26, height: 4, borderRadius: 2, background: '#201E2E', transformOrigin: 'left center', transform: 'rotate(35deg)' }} />
      </div>
    </div>
  );
}

export function ResultScreen({ v }: any) {
  return (
    <div data-screen-label="Quiz Result" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(18px,3vh,30px) 24px 24px;gap:16px;animation:fadeUp .5s ease both;')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SmallChop />
        <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:10px 14px;font-size:13px;font-weight:800;color:#201E2E;')}>Nice, {v.name}! Here's what {v.mascotName} found 🎉</div>
      </div>
      <div style={css("font-family:'Press Start 2P';font-size:14px;color:#201E2E;margin-top:6px;")}>YOUR TOP METHODS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(v.resultCards || []).map((rc: any, i: number) => (
          <div key={i} style={{ background: '#fff', border: '3px solid #201E2E', boxShadow: '5px 5px 0 ' + rc.color, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#201E2E' }}>{rc.rankLabel} {rc.label}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: rc.color, border: '2px solid #201E2E', padding: '3px 8px' }}>MATCH</div>
            </div>
            <div style={css('font-size:13px;color:#463f52;font-weight:700;margin-top:8px;line-height:1.5;')}>{rc.whyWorks}</div>
            <div style={css('font-size:11px;color:#8a8194;font-weight:700;margin-top:8px;line-height:1.5;font-style:italic;')}>📚 {rc.evidence}</div>
          </div>
        ))}
      </div>
      <button onClick={v.goToMaterial} style={css("font-family:'Nunito';font-weight:900;font-size:15px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:15px;cursor:pointer;margin-top:8px;")}>ADD MY STUDY MATERIAL →</button>
    </div>
  );
}
