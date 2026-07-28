// @ts-nocheck
import React from 'react';
import { css } from '../utils';

export function ProcessingScreen({ v }: any) {
  return (
    <div data-screen-label="Processing" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:20px;padding:28px;padding-block:max(28px,calc((100% - 380px) / 2));')}>
      {v.extractError ? (
        <div style={css('width:100%;background:#fff;border:3px solid #FF5A5F;box-shadow:5px 5px 0 #FF5A5F;padding:20px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;')}>
          <div style={{ fontSize: 30 }}>😵</div>
          <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;")}>Couldn't process your notes</div>
          <div style={css('font-size:13px;font-weight:700;color:#8a8194;line-height:1.5;')}>{v.extractErrorMsg}</div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={v.cancelExtractToMaterial} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:12px;cursor:pointer;")}>← BACK</button>
            <button onClick={v.retryExtract} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:12px;cursor:pointer;")}>TRY AGAIN</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 36 }}>🧠</div>
          <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;text-align:center;")}>Chop is reading your notes...</div>
          <div style={css('font-size:13px;font-weight:700;color:#8a8194;text-align:center;max-width:280px;line-height:1.5;')}>Pulling out every concept, term, and key idea to build your study tools.</div>
          {v.extractCountdown > 0 && (
            <div style={css("font-family:'Press Start 2P';font-size:22px;color:#FF6B4A;")}>{v.extractCountdown}s</div>
          )}
          <div style={css('width:100%;height:8px;background:#F1E4CC;border:2px solid #201E2E;overflow:hidden;')}>
            <div style={{ height: '100%', width: '60%', background: '#FF6B4A', animation: 'spin 2s linear infinite' }} />
          </div>
          <button onClick={v.cancelExtractToMaterial} style={css("font-family:'Nunito';font-weight:900;font-size:12px;color:#8a8194;background:transparent;border:none;cursor:pointer;")}>cancel</button>
        </>
      )}
    </div>
  );
}
