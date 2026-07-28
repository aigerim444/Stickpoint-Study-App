// @ts-nocheck
import React from 'react';
import { css } from '../utils';

function ChopMascot({ scale = 1.3, animation = 'pipBounce 2.2s ease-in-out infinite' }: any) {
  const w = Math.round(64 * scale); const h = Math.round(90 * scale);
  return (
    <div style={{ width: w, height: h, position: 'relative', flexShrink: 0, animation }}>
      <div style={{ position: 'relative', width: 64, height: 90, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
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

export function WelcomeScreen({ v }: any) {
  return (
    <div data-screen-label="Welcome" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:clamp(20px,4vh,36px) 28px;gap:clamp(14px,2.4vh,22px);animation:fadeUp .5s ease both;')}>
      <div style={css('width:83px;height:117px;position:relative;flex:none;margin-top:auto;animation:pipBounce 2.2s ease-in-out infinite;')}>
        <ChopMascot scale={1.3} animation="" />
      </div>
      <div style={css("background:#fff;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:12px 20px;font-size:15px;font-weight:800;color:#201E2E;text-align:center;line-height:1.4;")}>Hey! I'm {v.mascotName}. Welcome to Stickpoint!</div>
      <div style={css("font-family:'Press Start 2P';font-size:clamp(18px,4vw,26px);color:#201E2E;letter-spacing:2px;text-align:center;")}>STICKPOINT</div>
      <div style={css('font-size:14px;font-weight:700;color:#463f52;text-align:center;line-height:1.5;max-width:320px;')}>Find the study method that actually works for <strong>YOUR</strong> brain.</div>
      <div style={css('width:100%;display:flex;flex-direction:column;gap:12px;')}>
        <div>
          <div style={css("font-size:11px;font-weight:900;color:#8a8194;letter-spacing:1px;margin-bottom:6px;")}>WHAT SHOULD {v.mascotName.toUpperCase()} CALL YOU?</div>
          <input
            type="text"
            placeholder="Your first name"
            value={v.nameDraft}
            onChange={v.onNameInput}
            style={css('width:100%;box-sizing:border-box;font-family:Nunito;font-weight:700;font-size:15px;padding:12px 14px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;')}
          />
        </div>
        <div>
          <div style={css("font-size:11px;font-weight:900;color:#8a8194;letter-spacing:1px;margin-bottom:6px;")}>HOW OLD ARE YOU?</div>
          <input
            type="number"
            placeholder="e.g. 15"
            value={v.ageDraft}
            onChange={v.onAgeInput}
            min="5" max="99"
            style={css('width:100%;box-sizing:border-box;font-family:Nunito;font-weight:700;font-size:15px;padding:12px 14px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;')}
          />
          <div style={css('font-size:11px;font-weight:700;color:#8a8194;line-height:1.5;margin-top:4px;')}>{v.mascotName} uses this to pitch explanations and examples at the right level, not too babyish, not over your head.</div>
        </div>
      </div>
      <button onClick={v.submitName} disabled={v.nameDisabled} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 15, color: '#fff', background: v.nameBtnColor, border: '3px solid #201E2E', boxShadow: '4px 4px 0 #201E2E', padding: '15px 30px', cursor: v.nameBtnCursor, marginTop: 6, width: '100%' }}>LET'S GO →</button>
      <div style={{ marginBottom: 'auto' }} />
    </div>
  );
}
