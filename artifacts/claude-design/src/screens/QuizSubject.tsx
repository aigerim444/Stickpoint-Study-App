// @ts-nocheck
import React from 'react';
import { css } from '../utils';

export function QuizSubjectScreen({ v }: any) {
  return (
    <div data-screen-label="Quiz - Subject" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(16px,3vh,26px) 24px;gap:clamp(12px,2vh,16px);animation:fadeUp .4s ease both;')}>
      <div style={css("font-family:'Press Start 2P';font-size:11px;color:#201E2E;line-height:1.8;")}>STEP 1 OF 2</div>
      <div style={css('font-size:16px;font-weight:900;color:#201E2E;line-height:1.4;')}>What are you mainly studying right now?</div>
      <div style={css('font-size:12px;font-weight:700;color:#8a8194;line-height:1.5;')}>This helps Chop weight the quiz results toward what actually works for your subject.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {(v.subjectOptions || []).map((opt: any, i: number) => (
          <button key={i} onClick={opt.pick} style={css("text-align:left;font-family:'Nunito';font-weight:800;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px 16px;cursor:pointer;line-height:1.4;")}>{opt.label}</button>
        ))}
      </div>
    </div>
  );
}
