// @ts-nocheck
import React from 'react';
import { css } from '../utils';

export function QuizQuestionScreen({ v }: any) {
  return (
    <div data-screen-label="Quiz - Question" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(16px,3vh,26px) 24px;gap:clamp(12px,2vh,16px);animation:fadeUp .4s ease both;')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;")}>Q {v.quizStepNum} OF {(v.quizOptions || []).length > 0 ? '6' : '6'}</div>
        <div style={css('height:10px;flex:1;background:#F1E4CC;border:2px solid #201E2E;overflow:hidden;')}>
          <div style={{ height: '100%', width: v.quizPct, background: '#FF6B4A', transition: 'width .3s' }} />
        </div>
      </div>
      <div style={css('font-size:16px;font-weight:800;color:#201E2E;line-height:1.5;')}>{v.currentQuizQuestion}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(v.quizOptions || []).map((opt: any, i: number) => (
          <button key={i} onClick={opt.pick} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: opt.color, background: opt.bg, border: '3px solid #201E2E', boxShadow: opt.shadow, padding: 12, cursor: 'pointer', lineHeight: 1.4, position: 'relative' }}>
            <span style={{ flex: 1 }}>{opt.label}</span>
            {opt.badgeShown && <span style={css('font-size:9px;font-weight:900;color:#fff;background:#201E2E;padding:2px 6px;letter-spacing:.5px;white-space:nowrap;')}>{opt.weightBadge}</span>}
          </button>
        ))}
      </div>
      <div style={{ color: v.quizTieColor, fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>{v.quizTieHint}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <button onClick={v.quizBack} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:13px 18px;cursor:pointer;")}>← BACK</button>
        <button onClick={v.quizNext} disabled={v.quizCantNext} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: v.quizNextBg, border: '3px solid #201E2E', boxShadow: '4px 4px 0 #201E2E', padding: 13, cursor: v.quizCantNext ? 'default' : 'pointer' }}>{v.quizNextLabel}</button>
      </div>
    </div>
  );
}
