// @ts-nocheck
import React from 'react';
import { css } from '../utils';

export function MethodTutorialScreen({ v }: any) {
  return (
    <div data-screen-label="Method Tutorial" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(16px,3vh,26px) 24px;gap:14px;animation:fadeUp .4s ease both;')}>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#FF6B4A;line-height:1.8;letter-spacing:1px;")}>HOW THIS WORKS</div>
      <div style={css("font-family:'Nunito';font-weight:900;font-size:20px;color:#201E2E;")}>{v.mtLabel}</div>
      <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.6;background:#FFF3DE;border:3px solid #FFC93C;padding:12px;')}>{v.mtWhyWorks}</div>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;line-height:1.8;margin-top:4px;")}>HOW CHOP RUNS IT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(v.mtSteps || []).map((st: any, i: number) => (
          <div key={i} style={css('display:flex;align-items:flex-start;gap:10px;background:#fff;border:3px solid #201E2E;padding:10px 12px;')}>
            <div style={css("font-family:'Press Start 2P';font-size:11px;color:#7C5CFC;flex-shrink:0;")}>{st.n}</div>
            <div style={css('font-size:13px;font-weight:700;color:#201E2E;line-height:1.4;')}>{st.text}</div>
          </div>
        ))}
      </div>
      <button onClick={v.startStudying} style={css("font-family:'Nunito';font-weight:900;font-size:15px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:15px;cursor:pointer;margin-top:6px;")}>START STUDYING →</button>
    </div>
  );
}
