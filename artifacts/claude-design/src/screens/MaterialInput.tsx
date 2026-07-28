// @ts-nocheck
import React, { useRef } from 'react';
import { css } from '../utils';

export function MaterialInputScreen({ v }: any) {
  const pdfRef = useRef<any>(null);
  const photoRef = useRef<any>(null);
  return (
    <div data-screen-label="Material Input" style={css('flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:clamp(18px,3vh,28px) 24px;gap:14px;animation:fadeUp .4s ease both;')}>
      {v.materialCameFromApp && (
        <button onClick={v.backToApp} style={css("align-self:flex-start;font-family:'Nunito';font-weight:900;font-size:11px;color:#201E2E;background:#fff;border:2px solid #201E2E;padding:5px 10px;cursor:pointer;")}>← BACK TO APP</button>
      )}
      <div style={css("font-family:'Press Start 2P';font-size:12px;color:#201E2E;line-height:1.8;")}>ADD STUDY MATERIAL</div>
      <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.5;')}>Paste your notes, a chapter, or anything you're studying. Chop's AI will turn it into flashcards and study tools.</div>
      <div style={{ display: 'flex', gap: 0, borderRadius: 0 }}>
        <button onClick={v.setMaterialModePaste} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: v.pasteTabColor, background: v.pasteTabBg, border: '3px solid #201E2E', padding: '8px 4px', cursor: 'pointer', borderRight: 0 }}>📝 PASTE</button>
        <button onClick={v.setMaterialModePdf} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: v.pdfTabColor, background: v.pdfTabBg, border: '3px solid #201E2E', padding: '8px 4px', cursor: 'pointer', borderRight: 0 }}>📄 PDF</button>
        <button onClick={v.setMaterialModePhoto} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: v.photoTabColor, background: v.photoTabBg, border: '3px solid #201E2E', padding: '8px 4px', cursor: 'pointer' }}>📷 PHOTO</button>
      </div>
      {v.isMaterialModePaste && (
        <textarea
          value={v.materialDraft}
          onChange={v.onMaterialInput}
          placeholder="Paste your notes here... at least a paragraph or two works best."
          style={css('width:100%;min-height:220px;box-sizing:border-box;font-family:Nunito;font-weight:600;font-size:13px;padding:12px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')}
        />
      )}
      {v.isMaterialModePhoto && (
        <div style={css('display:flex;flex-direction:column;gap:10px;')}>
          <input ref={photoRef} type="file" accept="image/*" onChange={v.onPhotoChosen} style={{ display: 'none' }} />
          <button onClick={() => photoRef.current?.click()} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px;cursor:pointer;text-align:center;")}>📷 CHOOSE PHOTO</button>
          <div style={css('font-size:12px;font-weight:700;color:#8a8194;line-height:1.5;')}>{v.photoStatusText}</div>
          {v.materialDraft && (
            <textarea value={v.materialDraft} onChange={v.onMaterialInput} style={css('width:100%;min-height:120px;box-sizing:border-box;font-family:Nunito;font-size:12px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          )}
        </div>
      )}
      {v.isMaterialModePdf && (
        <div style={css('display:flex;flex-direction:column;gap:10px;')}>
          <input ref={pdfRef} type="file" accept=".pdf,application/pdf" onChange={v.onPdfChosen} style={{ display: 'none' }} />
          <button onClick={() => pdfRef.current?.click()} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px;cursor:pointer;text-align:center;")}>📄 CHOOSE PDF</button>
          <div style={css('font-size:12px;font-weight:700;color:#8a8194;line-height:1.5;')}>{v.pdfStatusText}</div>
          {v.materialDraft && (
            <textarea value={v.materialDraft} onChange={v.onMaterialInput} style={css('width:100%;min-height:120px;box-sizing:border-box;font-family:Nunito;font-size:12px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          )}
        </div>
      )}
      {v.materialHint && <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8194' }}>{v.materialHint}</div>}
      <button onClick={v.submitMaterial} disabled={v.materialDisabled} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 15, color: '#fff', background: v.materialBtnColor, border: '3px solid #201E2E', boxShadow: '4px 4px 0 #201E2E', padding: 15, cursor: v.materialBtnCursor, marginTop: 4 }}>EXTRACT &amp; STUDY →</button>
    </div>
  );
}
