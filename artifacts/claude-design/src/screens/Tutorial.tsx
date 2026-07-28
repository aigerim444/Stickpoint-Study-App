// @ts-nocheck
import React from 'react';
import { css } from '../utils';

export function TutorialScreen({ v }: any) {
  return (
    <div data-screen-label="Tutorial" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(18px,3vh,28px) 26px;gap:clamp(14px,2.2vh,20px);animation:fadeUp .4s ease both;')}>
      <div style={css("font-family:'Press Start 2P';font-size:12px;color:#201E2E;line-height:1.8;")}>HOW IT WORKS</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {(v.tutorialDots || []).map((d: any, i: number) => (
          <div key={i} style={{ width: d.active ? 20 : 8, height: 8, borderRadius: 4, background: d.active ? '#FF6B4A' : '#E8E2D6', transition: 'width .3s' }} />
        ))}
      </div>
      <div style={css("font-family:'Press Start 2P';font-size:13px;color:#201E2E;line-height:1.8;")}>{v.tutorialTitle}</div>
      <div style={css('font-size:14px;font-weight:700;color:#463f52;line-height:1.7;flex:1;')}>{v.tutorialBody}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        {v.tutorialShowBack && (
          <button onClick={v.tutorialBack} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px;cursor:pointer;")}>← BACK</button>
        )}
        <button onClick={v.tutorialNext} style={css("flex:2;font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:14px;cursor:pointer;")}>{v.tutorialNextLabel}</button>
      </div>
    </div>
  );
}
