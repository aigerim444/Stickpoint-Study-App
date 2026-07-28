// @ts-nocheck
import React from 'react';
import { css } from '../utils';

function Chop16() {
  return (
    <div style={{ width: 26, height: 36, position: 'relative', animation: 'pipBounce 2.4s ease-in-out infinite' }}>
      <div style={{ position: 'relative', width: 64, height: 90, transform: 'scale(0.4)', transformOrigin: 'top left' }}>
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

function GenLoader({ label }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
      <div style={{ fontSize: 30 }}>🧠</div>
      <div style={css('font-size:14px;font-weight:800;color:#201E2E;')}>{label || 'Chop is generating your content...'}</div>
    </div>
  );
}

function GenError({ label, retry }: any) {
  return (
    <div style={css('background:#fff;border:3px solid #FF5A5F;box-shadow:4px 4px 0 #FF5A5F;padding:18px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;')}>
      <div style={css('font-size:13px;font-weight:800;color:#201E2E;line-height:1.5;')}>{label || "Couldn't generate content. Try again."}</div>
      <button onClick={retry} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:11px 20px;cursor:pointer;")}>TRY AGAIN</button>
    </div>
  );
}

// ─── Active Recall ───────────────────────────────────────────────────────────
function ActiveRecall({ v }: any) {
  const ar = v.arUI;
  if (ar.finished) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:20px;display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;')}>
        <div style={{ fontSize: 32 }}>🎉</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;")}>Deck complete!</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[['Easy', ar.counts?.easy || 0, '#2DD4A7'], ['Medium', ar.counts?.medium || 0, '#FFC93C'], ['Hard', ar.counts?.hard || 0, '#FF5A5F']].map(([l, n, c]: any) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{n}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#8a8194' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={ar.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#201E2E;background:#fff;padding:13px;cursor:pointer;")}>RESTART DECK</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>{ar.remaining} LEFT</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['E', ar.counts?.easy || 0, '#2DD4A7'], ['M', ar.counts?.medium || 0, '#FFC93C'], ['H', ar.counts?.hard || 0, '#FF5A5F']].map(([l, n, c]: any) => (
            <div key={l} style={{ fontSize: 11, fontWeight: 900, color: c }}>{l}: {n}</div>
          ))}
        </div>
      </div>
      <div
        onClick={ar.flipCard}
        style={{ background: '#fff', border: '3px solid #201E2E', boxShadow: '5px 5px 0 #7C5CFC', padding: 24, minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', textAlign: 'center' }}
      >
        {!ar.flipped ? (
          <>
            <div style={css("font-size:11px;font-weight:900;color:#7C5CFC;letter-spacing:1px;")}>QUESTION</div>
            <div style={css('font-size:16px;font-weight:800;color:#201E2E;line-height:1.5;')}>{ar.cardFront}</div>
            <div style={css('font-size:11px;font-weight:700;color:#8a8194;margin-top:4px;')}>tap to reveal</div>
          </>
        ) : (
          <>
            <div style={css("font-size:11px;font-weight:900;color:#2DD4A7;letter-spacing:1px;")}>ANSWER</div>
            <div style={css('font-size:16px;font-weight:800;color:#201E2E;line-height:1.5;')}>{ar.cardBack}</div>
          </>
        )}
      </div>
      {ar.flipped && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[['EASY ✓', ar.rateEasy, '#2DD4A7'], ['MEDIUM ~', ar.rateMedium, '#FFC93C'], ['HARD ✗', ar.rateHard, '#FF5A5F']].map(([l, fn, c]: any) => (
            <button key={l} onClick={fn} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: '#201E2E', background: '#fff', border: '3px solid #201E2E', boxShadow: '3px 3px 0 ' + c, padding: '10px 4px', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Blurting ────────────────────────────────────────────────────────────────
function Blurting({ v }: any) {
  const bl = v.blurtingUI;
  if (bl.phaseTopics) return <GenLoader label="Chop is picking your topics..." />;
  if (bl.phaseTopicsError) return <GenError label="Couldn't pull topics. Try again." retry={bl.retryTopics} />;
  if (bl.phaseGrading) return <GenLoader label="Chop is comparing your blurt..." />;
  if (bl.phaseWrite) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>TOPIC {bl.topicNum} OF {bl.topicCount}</div>
        <div style={css('font-size:12px;font-weight:900;color:#201E2E;background:#FFC93C;border:2px solid #201E2E;padding:3px 10px;')}>⏱ {bl.timerLabel}</div>
      </div>
      {bl.hasPrev && <div style={css('font-size:11px;font-weight:700;color:#8a8194;')}>{bl.prevLine}</div>}
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #7C5CFC;padding:26px 18px;text-align:center;font-weight:900;font-size:22px;color:#201E2E;line-height:1.3;')}>{bl.topicName}</div>
      <textarea value={bl.text} onChange={(e) => bl.setText(e)} placeholder="Write everything you know about this topic without looking at anything" style={css('width:100%;min-height:170px;box-sizing:border-box;font-family:Nunito;font-weight:600;font-size:14px;padding:12px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
      {bl.gradeError && <div style={css('font-size:12px;font-weight:800;color:#c92c30;')}>Couldn't grade that one. Try again.</div>}
      <button onClick={bl.submit} disabled={bl.cantSubmit} style={{ fontFamily: 'Nunito', fontWeight: 900, border: '3px solid #201E2E', fontSize: 14, color: '#fff', background: bl.cantSubmit ? '#c9c2b8' : '#FF6B4A', boxShadow: bl.cantSubmit ? 'none' : '4px 4px 0 #201E2E', padding: 13, cursor: bl.cantSubmit ? 'default' : 'pointer' }}>DONE WRITING →</button>
    </div>
  );
  if (bl.phaseCompare) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;line-height:1.8;")}>YOUR BLURT</div>
      <div style={{ background: '#fff', border: '3px solid #201E2E', padding: 14, fontSize: 13, fontWeight: 700, color: '#201E2E', lineHeight: 1.6 }}>
        {bl.blurtSegments && bl.blurtSegments.length ? bl.blurtSegments.map((seg: any, i: number) => <span key={i} style={seg.style}>{seg.text}</span>) : <span>{bl.text}</span>}
      </div>
      {bl.scoreLine && <div style={css('font-size:13px;font-weight:800;color:#201E2E;')}>{bl.scoreLine}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={bl.tryAgain} style={css("flex:1;font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:11px;cursor:pointer;")}>TRY AGAIN</button>
        <button onClick={bl.nextTopic} style={css("flex:1;font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#fff;background:#2DD4A7;box-shadow:3px 3px 0 #201E2E;padding:11px;cursor:pointer;")}>{bl.nextLabel}</button>
      </div>
    </div>
  );
  if (bl.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>📝</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>Session complete!</div>
        <div style={css('font-size:13px;font-weight:800;color:#463f52;margin-top:4px;')}>Overall: {bl.overall}%</div>
      </div>
      {bl.summaryRows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: r.weak ? '#FFF3DE' : '#F3FBF8', border: '2px solid ' + (r.weak ? '#FFC93C' : '#2DD4A7'), padding: '10px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{r.topic}</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: r.weak ? '#c94a00' : '#1a9c77' }}>{r.label} ({r.pct})</div>
        </div>
      ))}
      <button onClick={bl.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>BLURT AGAIN</button>
    </div>
  );
  return null;
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────
function Pomodoro({ v }: any) {
  const pm = v.pomodoroUI;
  if (pm.phaseIdle) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 36 }}>⏱</div>
      <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;")}>Ready for a {pm.phaseIdle ? '25' : '?'}-minute focus sprint?</div>
      <div style={css('font-size:13px;font-weight:700;color:#463f52;max-width:280px;line-height:1.5;')}>Study for 25 min, then take a 5-min break. After 4 rounds you earn a long break.</div>
      <button onClick={pm.start} style={css("font-family:'Nunito';font-weight:900;font-size:15px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:15px 36px;cursor:pointer;margin-top:4px;")}>START POMODORO →</button>
    </div>
  );
  if (pm.phaseStudy || pm.phasePaused) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#8a8194;letter-spacing:1px;")}>ROUND {pm.pomNum}</div>
      <div style={{ position: 'relative', width: 150, height: 150 }}>
        <svg width={150} height={150} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={75} cy={75} r={60} fill="none" stroke="#F1E4CC" strokeWidth={12} />
          <circle cx={75} cy={75} r={60} fill="none" stroke="#FF6B4A" strokeWidth={12} strokeDasharray={`${2 * Math.PI * 60 * parseFloat(pm.pct) / 100} ${2 * Math.PI * 60}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={css("font-family:'Press Start 2P';font-size:22px;color:#201E2E;")}>{pm.timerLabel}</div>
          <div style={css('font-size:10px;font-weight:800;color:#8a8194;margin-top:3px;')}>{pm.phasePaused ? 'PAUSED' : 'FOCUS'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        {pm.phaseStudy && <button onClick={pm.pause} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:13px;cursor:pointer;")}>PAUSE</button>}
        {pm.phasePaused && <button onClick={pm.resume} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>RESUME</button>}
      </div>
    </div>
  );
  if (pm.phaseCheck) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 30 }}>✅</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>Focus sprint done!</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:4px;line-height:1.5;')}>How focused did you feel?</div>
      </div>
      <textarea value={pm.focusInput} onChange={pm.setFocusInput} placeholder="Anything you want to note about this session (optional)" style={css('width:100%;min-height:80px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:none;')} />
      <button onClick={pm.submitCheck} style={css("font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#2DD4A7;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>TAKE A BREAK →</button>
    </div>
  );
  if (pm.phaseBreak || pm.phaseLongBreak) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 36 }}>{pm.phaseLongBreak ? '🏆' : '☕'}</div>
      <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;")}>{pm.phaseLongBreak ? 'Long break time!' : '5-minute break!'}</div>
      <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.5;max-width:280px;')}>Step away from the screen. Stretch, get water, relax.</div>
      <button onClick={pm.startBreak} style={css("font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#2DD4A7;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:13px 28px;cursor:pointer;")}>START BREAK ☕</button>
    </div>
  );
  if (pm.phaseBreaking) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 36 }}>⏰</div>
      <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;")}>Break time!</div>
      <button onClick={pm.endBreak} style={css("font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:13px 28px;cursor:pointer;")}>START NEXT ROUND →</button>
    </div>
  );
  return null;
}

// ─── Practice Testing ────────────────────────────────────────────────────────
function PracticeTesting({ v }: any) {
  const pt = v.ptUI;
  if (pt.phaseGen) return <GenLoader label="Chop is writing your test questions..." />;
  if (pt.phaseGenError) return <GenError label="Couldn't generate questions. Try again." retry={pt.retry} />;
  if (pt.phaseGrading) return <GenLoader label="Grading your answers..." />;
  if (pt.phaseReady) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 34 }}>📋</div>
      <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;")}>{pt.total} questions, {Math.ceil(pt.total)} minutes</div>
      <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.5;max-width:280px;')}>Notes stay hidden. One question at a time. No going back.</div>
      <button onClick={pt.start} style={css("font-family:'Nunito';font-weight:900;font-size:15px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:14px 30px;cursor:pointer;")}>START TEST →</button>
    </div>
  );
  if (pt.phaseTest) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>Q {pt.qNum} OF {pt.total}</div>
        <div style={{ fontSize: 13, fontWeight: 900, color: pt.timerColor }}>⏱ {pt.timerLabel}</div>
      </div>
      <div style={css('height:8px;background:#F1E4CC;border:2px solid #201E2E;overflow:hidden;')}>
        <div style={{ height: '100%', width: pt.progressPct, background: '#FF6B4A', transition: 'width .3s' }} />
      </div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #7C5CFC;padding:18px;font-size:15px;font-weight:800;color:#201E2E;line-height:1.5;')}>{pt.question}</div>
      {pt.isMC && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pt.mcOptions.map((o: any, i: number) => (
            <button key={i} onClick={o.pick} style={css("text-align:left;font-family:'Nunito';font-weight:700;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:13px 14px;cursor:pointer;line-height:1.4;")}><strong>{o.label}.</strong> {o.text}</button>
          ))}
        </div>
      )}
      {pt.isTF && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={pt.pickTrue} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px;cursor:pointer;")}>TRUE</button>
          <button onClick={pt.pickFalse} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:14px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:14px;cursor:pointer;")}>FALSE</button>
        </div>
      )}
      {pt.isSA && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea value={pt.saText} onChange={pt.setSaText} placeholder="Type your answer here..." style={css('width:100%;min-height:100px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          <button onClick={pt.submitSA} disabled={pt.cantSubmitSA} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: pt.saSubmitBg, border: '3px solid #201E2E', boxShadow: pt.cantSubmitSA ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: pt.saSubmitBgCursor }}>SUBMIT ANSWER →</button>
        </div>
      )}
    </div>
  );
  if (pt.phaseResults) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #7C5CFC;padding:20px;text-align:center;')}>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:24px;color:#201E2E;")}>{pt.scorePct}</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:4px;')}>{pt.rightCount} right · {pt.wrongCount} to review{pt.timedOut ? ' (timed out)' : ''}</div>
      </div>
      {pt.reviewRows.length > 0 && (
        <>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#FF5A5F;line-height:1.8;")}>REVIEW ({pt.reviewRows.length})</div>
          {pt.reviewRows.map((r: any, i: number) => (
            <div key={i} style={css('background:#fff;border:3px solid #FF5A5F;padding:12px;display:flex;flex-direction:column;gap:6px;')}>
              <div style={css('font-size:12px;font-weight:800;color:#201E2E;line-height:1.4;')}>{r.question}</div>
              <div style={css('font-size:11px;font-weight:700;color:#c92c30;')}>You: {r.yours}</div>
              <div style={css('font-size:11px;font-weight:700;color:#1a9c77;')}>✓ {r.correct}</div>
              {r.explanation && <div style={css('font-size:11px;font-weight:700;color:#463f52;line-height:1.4;')}>{r.explanation}</div>}
            </div>
          ))}
        </>
      )}
      {pt.rightRows.length > 0 && (
        <>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#2DD4A7;line-height:1.8;")}>GOT THESE ✓ ({pt.rightRows.length})</div>
          {pt.rightRows.map((r: any, i: number) => (
            <div key={i} style={css('background:#F3FBF8;border:3px solid #2DD4A7;padding:10px 12px;font-size:12px;font-weight:700;color:#14543f;line-height:1.4;')}>{r.question}</div>
          ))}
        </>
      )}
      <button onClick={pt.retry} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:13px;cursor:pointer;")}>NEW TEST →</button>
    </div>
  );
  return null;
}

// ─── Elaborative Interrogation ───────────────────────────────────────────────
function ElaborativeInterrogation({ v }: any) {
  const ei = v.elaborativeUI;
  if (ei.phaseGen) return <GenLoader label="Chop is building your why questions..." />;
  if (ei.phaseGenError) return <GenError label="Couldn't generate questions." retry={ei.retryGen} />;
  if (ei.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>💡</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>Session complete!</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:4px;')}>{ei.summaryLine}</div>
      </div>
      {ei.summaryRows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff', border: '2px solid #201E2E', padding: '10px 12px' }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#201E2E', lineHeight: 1.4 }}>{r.fact}</div>
            {r.flagged && <div style={css('font-size:11px;font-weight:700;color:#8a8194;margin-top:4px;line-height:1.4;')}>{r.modelAnswer}</div>}
          </div>
        </div>
      ))}
      <button onClick={ei.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>START AGAIN</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>FACT {ei.num} OF {ei.total}</div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FFC93C;padding:16px;font-size:14px;font-weight:800;color:#201E2E;line-height:1.5;')}>{ei.fact}</div>
      {ei.phaseLearn && (
        <>
          {ei.hasPrimer && <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.5;background:#FFF9EF;border:2px solid #FFC93C;padding:12px;')}>{ei.primer}</div>}
          {ei.hasChain && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {ei.chainNodes.map((node: string, i: number) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#EDE7FF', border: '2px solid #201E2E', padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>{node}</div>
                  {i < ei.chainNodes.length - 1 && <div style={{ fontSize: 12, color: '#8a8194' }}>→</div>}
                </React.Fragment>
              ))}
            </div>
          )}
          <button onClick={ei.startQuestion} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#7C5CFC;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>ANSWER THE WHY QUESTION →</button>
        </>
      )}
      {(ei.phaseWhy || ei.phaseGrading) && (
        <>
          <div style={css('background:#EDE7FF;border:3px solid #201E2E;padding:14px;font-size:14px;font-weight:800;color:#201E2E;line-height:1.4;')}>{ei.whyQuestion}</div>
          <textarea value={ei.whyText} onChange={ei.setWhyText} placeholder="Explain why this is true..." style={css('width:100%;min-height:100px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          {ei.phaseGrading ? <GenLoader label="Checking your reasoning..." /> : (
            <button onClick={ei.submitWhy} disabled={ei.cantSubmitWhy} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: ei.cantSubmitWhy ? '#c9c2b8' : '#FF6B4A', border: '3px solid #201E2E', boxShadow: ei.cantSubmitWhy ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: ei.cantSubmitWhy ? 'default' : 'pointer' }}>CHECK MY REASONING →</button>
          )}
        </>
      )}
      {ei.phaseReview && (
        <>
          <div style={{ background: '#fff', border: '3px solid #201E2E', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: '#201E2E' }}>{ei.whyVerdictLabel}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#463f52', lineHeight: 1.5 }}>{ei.whyFeedback}</div>
          </div>
          <div style={css('background:#FFF9EF;border:2px solid #FFC93C;padding:12px;')}>
            <div style={css("font-size:11px;font-weight:900;color:#8a8194;letter-spacing:1px;margin-bottom:6px;")}>MODEL ANSWER</div>
            <div style={css('font-size:13px;font-weight:700;color:#201E2E;line-height:1.5;')}>{ei.modelAnswer}</div>
          </div>
          <button onClick={ei.gotIt} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#2DD4A7;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>{ei.gotItLabel}</button>
        </>
      )}
    </div>
  );
}

// ─── Concrete Examples ───────────────────────────────────────────────────────
function ConcreteExamples({ v }: any) {
  const ce = v.concreteUI;
  if (ce.phaseGen) return <GenLoader label="Chop is finding real-world examples..." />;
  if (ce.phaseGenError) return <GenError label="Couldn't generate examples." retry={ce.retryGen} />;
  if (ce.phaseGrading) return <GenLoader label="Checking your connection..." />;
  if (ce.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>🎉</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>All examples covered!</div>
      </div>
      {ce.summaryRows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: r.passed ? '#F3FBF8' : '#FFF3DE', border: '2px solid ' + (r.passed ? '#2DD4A7' : '#FFC93C'), padding: '10px 14px' }}>
          <span style={{ fontSize: 16 }}>{r.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{r.concept}</span>
        </div>
      ))}
      <button onClick={ce.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>GO AGAIN</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>CONCEPT {ce.num} OF {ce.total}</div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FF6B4A;padding:18px;')}>
        <div style={css('font-size:16px;font-weight:900;color:#201E2E;')}>{ce.concept}</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:8px;line-height:1.5;')}>{ce.definition}</div>
      </div>
      {!ce.revealed ? (
        <button onClick={ce.reveal} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#7C5CFC;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>SHOW ME A REAL EXAMPLE →</button>
      ) : (
        <>
          <div style={css('background:#EDE7FF;border:3px solid #201E2E;padding:16px;font-size:14px;font-weight:700;color:#201E2E;line-height:1.5;')}>{ce.example}</div>
          {ce.hasSampleProblem && <div style={css("background:#FFF3DE;border:2px solid #FFC93C;padding:12px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#201E2E;line-height:1.5;")}>{ce.sampleProblem}</div>}
          {ce.phaseFeedback ? (
            <>
              <div style={{ background: '#fff', border: '3px solid #201E2E', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: ce.correct ? '#1a9c77' : '#c92c30' }}>{ce.correct ? '✓ Connected!' : '✗ Not quite'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#463f52', lineHeight: 1.5 }}>{ce.gotRight || ce.missed}</div>
              </div>
              {ce.reinforce && <div style={css('background:#F3FBF8;border:2px solid #2DD4A7;padding:12px;font-size:13px;font-weight:700;color:#14543f;line-height:1.5;')}>{ce.reinforce}</div>}
              <button onClick={ce.gotIt} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#2DD4A7;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>NEXT CONCEPT →</button>
            </>
          ) : (
            <>
              <div style={css('font-size:14px;font-weight:800;color:#201E2E;')}>{ce.connectionQuestion}</div>
              <textarea value={ce.text} onChange={ce.setText} placeholder="Explain the connection..." style={css('width:100%;min-height:90px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
              {ce.gradeError && <div style={css('font-size:12px;font-weight:800;color:#c92c30;')}>Couldn't grade that. Try again.</div>}
              <button onClick={ce.submit} disabled={ce.cantSubmit} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: ce.cantSubmit ? '#c9c2b8' : '#FF6B4A', border: '3px solid #201E2E', boxShadow: ce.cantSubmit ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: ce.cantSubmit ? 'default' : 'pointer' }}>CHECK CONNECTION →</button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Self Explanation ────────────────────────────────────────────────────────
function SelfExplanation({ v }: any) {
  const se = v.seUI;
  if (se.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>📖</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>Reading session complete!</div>
        <div style={css('font-size:13px;font-weight:800;color:#463f52;margin-top:4px;')}>You explained {se.firstTryCount} out of {se.chunkCount} lines correctly on the first try.</div>
      </div>
      {se.hasStruggled && (
        <>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#FF5A5F;line-height:1.8;")}>WORTH ANOTHER LOOK ({se.struggledCount})</div>
          {se.struggledRows.map((r: any, i: number) => (
            <div key={i} style={css('background:#fff;border:3px solid #FF5A5F;padding:12px;display:flex;flex-direction:column;gap:6px;')}>
              <div style={css('font-size:10px;font-weight:900;color:#c92c30;letter-spacing:1px;text-transform:uppercase;')}>{r.keyIdea}</div>
              <div style={css('font-size:12px;font-weight:600;color:#463f52;line-height:1.5;')}>{r.chunk}</div>
              <div style={css('font-size:12px;font-weight:800;color:#201E2E;line-height:1.5;background:#F6F1E5;border:2px solid #c9c2b8;padding:8px;')}>Simpler: {r.simpler}</div>
            </div>
          ))}
          <button onClick={se.toFlashcards} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#fff;background:#7C5CFC;box-shadow:3px 3px 0 #201E2E;padding:12px;cursor:pointer;")}>TURN THESE INTO FLASHCARDS →</button>
        </>
      )}
      {se.noStruggled && <div style={css('font-size:13px;font-weight:700;color:#8a8194;text-align:center;')}>You explained everything on the first try! 🎉</div>}
      <button onClick={se.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>READ IT AGAIN</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>LINE {se.idx + 1} OF {se.chunkCount}</div>
      </div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #7C5CFC;padding:18px;font-size:15px;font-weight:700;color:#201E2E;line-height:1.6;')}>{se.chunk}</div>
      {se.phaseRead && (
        <>
          <textarea value={se.text} onChange={se.setText} placeholder="Say this line back in your own words..." style={css('width:100%;min-height:90px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          <button onClick={se.submit} disabled={se.cantSubmit} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: se.cantSubmit ? '#c9c2b8' : '#FF6B4A', border: '3px solid #201E2E', boxShadow: se.cantSubmit ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: se.cantSubmit ? 'default' : 'pointer' }}>CHECK →</button>
        </>
      )}
      {se.phaseEvaluating && <GenLoader label="Checking that line..." />}
      {se.phaseFeedback && (
        <>
          <div style={se.verdictStyle}>
            <div style={{ fontSize: 16 }}>{se.verdictIcon}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: se.verdictTextColor }}>{se.feedback}</div>
              {se.wrongFlag && <div style={css('font-size:12px;font-weight:800;color:#201E2E;line-height:1.5;background:#fff;border:2px solid #201E2E;padding:8px;')}>Simpler: {se.simpler}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={se.explainAgain} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;flex:1;font-size:12px;color:#201E2E;background:#fff;padding:11px;cursor:pointer;")}>SAY IT AGAIN</button>
            <button onClick={se.gotIt} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;flex:1;font-size:12px;color:#fff;background:#2DD4A7;box-shadow:3px 3px 0 #201E2E;padding:11px;cursor:pointer;")}>{se.gotItLabel}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Problem Sets ────────────────────────────────────────────────────────────
function ProblemSets({ v }: any) {
  const ps = v.psUI;
  if (ps.phaseGen) return <GenLoader label="Chop is pulling problem types from your notes..." />;
  if (ps.phaseGenError) return <GenError label={ps.genErrorText || "Couldn't generate problem sets."} retry={ps.canRetryGen ? ps.retryGen : undefined} />;
  if (ps.phaseGrading) return <GenLoader label="Grading your work..." />;
  if (ps.phasePick) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;line-height:1.8;")}>CHOOSE A SKILL</div>
      {ps.skillRows.map((r: any, i: number) => (
        <button key={i} onClick={r.pick} style={{ display: 'flex', alignItems: 'center', gap: 12, background: r.bg, border: '3px solid #201E2E', padding: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 28, height: 28, background: r.markBg, border: '2px solid #201E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: r.markColor, flexShrink: 0 }}>{r.mark}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#201E2E' }}>{r.skill}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8194', marginTop: 2 }}>{r.detail}</div>
          </div>
        </button>
      ))}
      {ps.anyDone && <button onClick={ps.toSummary} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>SEE SUMMARY →</button>}
    </div>
  );
  if (ps.phaseWorked) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;line-height:1.8;")}>WORKED EXAMPLE: {ps.skillName}</div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FFC93C;padding:16px;')}>
        <div style={css("font-family:'Courier New',monospace;font-size:17px;font-weight:700;color:#201E2E;line-height:1.5;text-align:center;")}>{ps.workedProblem}</div>
      </div>
      {ps.revealedSteps.map((st: any, i: number) => (
        <div key={i} style={css('background:#fff;border:3px solid #201E2E;padding:12px;display:flex;gap:10px;align-items:flex-start;')}>
          <div style={css("flex:none;width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:#EDE7FF;border:2px solid #201E2E;font-family:'Press Start 2P';font-size:9px;color:#201E2E;")}>{st.num}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            <div style={css("font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#201E2E;line-height:1.5;")}>{st.step}</div>
            <div style={css('font-size:12px;font-weight:700;color:#7C5CFC;line-height:1.5;')}>↳ {st.why}</div>
          </div>
        </div>
      ))}
      {ps.moreSteps && <button onClick={ps.revealStep} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#FFC93C;box-shadow:3px 3px 0 #201E2E;padding:12px;cursor:pointer;")}>SHOW ME THE NEXT STEP ↓</button>}
      {ps.allStepsShown && <button onClick={ps.startPractice} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#FF6B4A;box-shadow:4px 4px 0 #201E2E;padding:14px;cursor:pointer;")}>MY TURN, GIVE ME ONE →</button>}
    </div>
  );
  if (ps.phaseSolve) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>PROBLEM {ps.pNum} OF {ps.pTotal}</div>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', background: ps.stageBg, border: '2px solid #201E2E', padding: '3px 8px', letterSpacing: 1 }}>{ps.stageLabel}</div>
      </div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FF6B4A;padding:18px;')}>
        <div style={css("font-family:'Courier New',monospace;font-size:17px;font-weight:700;color:#201E2E;line-height:1.5;text-align:center;")}>{ps.problem}</div>
      </div>
      {ps.hasHint && <div style={css('background:#FFF3DE;border:2px solid #FFC93C;padding:10px;font-size:13px;font-weight:700;color:#201E2E;line-height:1.4;')}>💡 {ps.hint}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ps.symbols.map((sym: any, i: number) => (
          <button key={i} onClick={sym.tap} style={css("font-family:'Courier New',monospace;font-size:14px;font-weight:900;color:#201E2E;background:#EDE7FF;border:2px solid #201E2E;padding:6px 10px;cursor:pointer;")}>{sym.char}</button>
        ))}
      </div>
      <textarea value={ps.work} onChange={ps.setWork} placeholder="Write your work here, one step per line..." style={css('width:100%;min-height:120px;box-sizing:border-box;font-family:Courier New,monospace;font-size:14px;font-weight:700;padding:12px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
      {ps.gradeError && <div style={css('font-size:12px;font-weight:800;color:#c92c30;')}>Couldn't grade that. Try again.</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={ps.stuck} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:11px 16px;cursor:pointer;")}>HINT</button>
        <button onClick={ps.submit} disabled={ps.cantSubmit} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: ps.cantSubmit ? '#c9c2b8' : '#FF6B4A', border: '3px solid #201E2E', boxShadow: ps.cantSubmit ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: ps.cantSubmit ? 'default' : 'pointer' }}>SUBMIT →</button>
      </div>
    </div>
  );
  if (ps.phaseMarked) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={ps.verdictHeadStyle}>
        <div style={{ fontSize: 20 }}>{ps.verdictIcon}</div>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#201E2E' }}>{ps.verdictTitle}</div>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:4px;background:#fff;border:3px solid #201E2E;overflow:hidden;')}>
        {ps.markedLines.map((ml: any, i: number) => (
          <div key={i} style={ml.rowStyle}>
            <div style={ml.textStyle}>{ml.text}</div>
            {ml.mark && <div style={{ fontSize: 12, fontWeight: 900, color: ml.markColor, flexShrink: 0 }}>{ml.mark}</div>}
          </div>
        ))}
      </div>
      {ps.hasError && (
        <div style={css('background:#FFF3DE;border:3px solid #FFC93C;padding:14px;display:flex;flex-direction:column;gap:6px;')}>
          <div style={css("font-size:10px;font-weight:900;color:#8a8194;letter-spacing:1px;")}>{ps.errorTypeLabel}</div>
          <div style={css('font-size:13px;font-weight:700;color:#201E2E;line-height:1.5;')}>{ps.errorExplanation}</div>
          {ps.hasCorrectLine && <div style={css("font-family:'Courier New',monospace;font-size:13px;font-weight:800;color:#201E2E;background:#fff;border:2px solid #201E2E;padding:8px;")}>{ps.correctLine}</div>}
        </div>
      )}
      {ps.showAnswer && <div style={css("font-family:'Courier New',monospace;font-size:14px;font-weight:800;color:#1a9c77;background:#F3FBF8;border:3px solid #2DD4A7;padding:12px;")}>{ps.answer}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {ps.hasError && <button onClick={ps.fixIt} style={css("flex:1;font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>TRY AGAIN</button>}
        <button onClick={ps.nextProblem} style={{ flex: ps.hasError ? 1 : 'none', width: ps.hasError ? undefined : '100%', fontFamily: 'Nunito', fontWeight: 900, border: '3px solid #201E2E', fontSize: 13, color: '#fff', background: '#FF6B4A', boxShadow: '3px 3px 0 #201E2E', padding: 12, cursor: 'pointer' }}>{ps.nextLabel}</button>
      </div>
    </div>
  );
  if (ps.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:20px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>{ps.hasPatterns ? '🔎' : '🎉'}</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:17px;color:#201E2E;margin-top:6px;")}>{ps.summaryHeadline}</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:4px;')}>{ps.summaryLine}</div>
      </div>
      {ps.hasPatterns && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#FF5A5F;line-height:1.8;")}>ERROR PATTERNS</div>
          {ps.patternRows.map((r: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '2px solid #FF5A5F', padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#201E2E' }}>{r.type}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#c92c30' }}>×{r.count}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={ps.backToSkills} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>BACK TO SKILLS</button>
    </div>
  );
  return null;
}

// ─── Feynman ─────────────────────────────────────────────────────────────────
function Feynman({ v }: any) {
  const fe = v.feynmanUI;
  if (fe.phaseGen) return <GenLoader label="Chop is picking concepts to explain..." />;
  if (fe.phaseGenError) return <GenError label="Couldn't generate Feynman prompts." retry={fe.retryGen} />;
  if (fe.phaseGrading) return <GenLoader label="Grading your explanation..." />;
  if (fe.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>🎓</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>Session complete!</div>
      </div>
      {fe.summaryRows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '2px solid #201E2E', padding: '10px 14px' }}>
          <span style={{ fontSize: 14 }}>{r.icon}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{r.concept}</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: r.score >= 4 ? '#1a9c77' : '#c92c30' }}>{r.score}/5</span>
        </div>
      ))}
      <button onClick={fe.toFlashcards} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#fff;background:#7C5CFC;box-shadow:3px 3px 0 #201E2E;padding:12px;cursor:pointer;")}>WEAK ONES → FLASHCARDS</button>
      <button onClick={fe.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>GO AGAIN</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>CONCEPT {fe.num} OF {fe.total}</div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FF6B4A;padding:16px;font-size:15px;font-weight:800;color:#201E2E;line-height:1.5;')}>{fe.question || fe.concept}</div>
      {fe.phaseExplain && (
        <>
          <div style={css('font-size:12px;font-weight:700;color:#8a8194;line-height:1.5;')}>Explain this like you're talking to a 10-year-old. No jargon. Close your notes.</div>
          <textarea value={fe.text} onChange={fe.setText} placeholder="Explain it simply..." style={css('width:100%;min-height:130px;box-sizing:border-box;font-family:Nunito;font-size:13px;padding:10px;border:3px solid #201E2E;background:#fff;color:#201E2E;outline:none;resize:vertical;')} />
          <button onClick={fe.submit} disabled={fe.cantSubmit} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: fe.cantSubmit ? '#c9c2b8' : '#FF6B4A', border: '3px solid #201E2E', boxShadow: fe.cantSubmit ? 'none' : '3px 3px 0 #201E2E', padding: 13, cursor: fe.cantSubmit ? 'default' : 'pointer' }}>SUBMIT EXPLANATION →</button>
        </>
      )}
      {fe.phaseFeedback && (
        <>
          <div style={css('background:#fff;border:3px solid #201E2E;padding:14px;display:flex;flex-direction:column;gap:8px;')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[1,2,3,4,5].map((n: number) => <div key={n} style={{ width: 24, height: 24, borderRadius: '50%', background: n <= fe.score ? '#FF6B4A' : '#F1E4CC', border: '2px solid #201E2E' }} />)}
              <div style={{ fontSize: 12, fontWeight: 900, color: '#201E2E', marginLeft: 4 }}>{fe.score}/5</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#463f52', lineHeight: 1.5 }}>{fe.feedback}</div>
          </div>
          <div style={css('background:#FFF3DE;border:2px solid #FFC93C;padding:12px;')}>
            <div style={css("font-size:11px;font-weight:900;color:#8a8194;letter-spacing:1px;margin-bottom:6px;")}>IDEAL EXPLANATION</div>
            <div style={css('font-size:13px;font-weight:700;color:#201E2E;line-height:1.5;')}>{fe.model}</div>
          </div>
          <button onClick={fe.next} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#2DD4A7;box-shadow:3px 3px 0 #201E2E;padding:13px;cursor:pointer;")}>{fe.nextLabel}</button>
        </>
      )}
    </div>
  );
}

// ─── Chunking ────────────────────────────────────────────────────────────────
function Chunking({ v }: any) {
  const ch = v.chunkingUI;
  if (ch.phaseGen) return <GenLoader label="Chop is chunking your notes..." />;
  if (ch.phaseGenError) return <GenError label="Couldn't chunk these notes." retry={ch.retryGen} />;
  if (ch.phaseSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #2DD4A7;padding:18px;text-align:center;')}>
        <div style={{ fontSize: 28 }}>📚</div>
        <div style={css("font-family:'Nunito';font-weight:900;font-size:16px;color:#201E2E;margin-top:6px;")}>All chunks covered!</div>
        <div style={css('font-size:13px;font-weight:700;color:#463f52;margin-top:4px;')}>{ch.doneCount} of {ch.total} chunks done</div>
      </div>
      {ch.summaryRows.map((r: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: r.done ? '#F3FBF8' : '#fff', border: '2px solid ' + (r.done ? '#2DD4A7' : '#201E2E'), padding: '10px 14px' }}>
          <div style={{ fontSize: 14 }}>{r.done ? '✅' : '○'}</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</div>
        </div>
      ))}
      <button onClick={ch.restart} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:13px;color:#201E2E;background:#fff;padding:12px;cursor:pointer;")}>READ AGAIN</button>
    </div>
  );
  if (ch.phaseStudy && ch.chunk) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={css("font-size:11px;font-weight:800;color:#8a8194;letter-spacing:1px;")}>CHUNK {ch.num} OF {ch.total}</div>
        <div style={css('font-size:11px;font-weight:800;color:#201E2E;background:#FFC93C;border:2px solid #201E2E;padding:3px 10px;')}>{ch.pct}%</div>
      </div>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #7C5CFC;padding:20px;')}>
        <div style={css("font-family:'Press Start 2P';font-size:11px;color:#7C5CFC;margin-bottom:10px;")}>{ch.chunk.title}</div>
        <div style={css('font-size:14px;font-weight:700;color:#201E2E;line-height:1.6;')}>{ch.chunk.content}</div>
      </div>
      {ch.chunk.tip && <div style={css('background:#FFF9EF;border:2px solid #FFC93C;padding:10px;font-size:12px;font-weight:700;color:#201E2E;line-height:1.5;')}>💡 Study tip: {ch.chunk.tip}</div>}
      <button onClick={ch.next} style={css("font-family:'Nunito';font-weight:900;border:3px solid #201E2E;font-size:14px;color:#fff;background:#FF6B4A;box-shadow:4px 4px 0 #201E2E;padding:14px;cursor:pointer;")}>GOT IT, NEXT CHUNK →</button>
    </div>
  );
  return null;
}

// ─── Today Tab ───────────────────────────────────────────────────────────────
function TodayTab({ v }: any) {
  const topMethod = v.methodBadges && v.methodBadges.find((m: any) => m.isTopPick);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Top pick call-to-action */}
      {topMethod && (
        <div style={css('background:#FF6B4A;border:3px solid #201E2E;box-shadow:5px 5px 0 #201E2E;padding:16px;display:flex;flex-direction:column;gap:10px;')}>
          <div style={css("font-family:'Press Start 2P';font-size:9px;color:#fff;letter-spacing:1px;")}>⭐ YOUR TOP PICK</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{topMethod.label}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>Chop matched this method to your learning style. Start here.</div>
          <button onClick={topMethod.pick} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#FF6B4A;background:#fff;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:11px;cursor:pointer;")}>START {topMethod.label.toUpperCase()} →</button>
        </div>
      )}

      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #FF6B4A;padding:16px;')}>
        <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;margin-bottom:10px;")}>TODAY'S STUDY PLAN</div>
        {v.planSteps.length > 0 ? v.planSteps.map((st: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: '#FF6B4A', marginTop: 2 }}>{st.n}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#201E2E', lineHeight: 1.4 }}>{st.text}</div>
          </div>
        )) : <div style={{ fontSize: 13, fontWeight: 700, color: '#8a8194' }}>Complete the quiz to get a study plan.</div>}
      </div>
      {v.hasMissed && (
        <div style={css('background:#FFF3DE;border:3px solid #FFC93C;box-shadow:4px 4px 0 #201E2E;padding:14px;display:flex;flex-direction:column;gap:10px;')}>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;")}>REVIEW DUE 🔥</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#201E2E', lineHeight: 1.5 }}>{v.dueCount} item{v.dueCount > 1 ? 's' : ''} waiting from previous sessions.</div>
          <button onClick={v.reviewDue} style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:11px;cursor:pointer;")}>REVIEW NOW →</button>
        </div>
      )}
      <div>
        <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;margin-bottom:10px;")}>ALL METHODS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {v.methodBadges.map((m: any, i: number) => (
            <button key={i} onClick={m.pick} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: m.color, background: m.bg, border: '3px solid #201E2E', boxShadow: m.tried ? '2px 2px 0 #201E2E' : 'none', padding: '7px 12px', cursor: 'pointer' }}>{m.tried ? '✓ ' : ''}{m.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressTab({ v }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={css('flex:1;background:#fff;border:3px solid #201E2E;padding:14px;text-align:center;')}>
          <div style={css("font-family:'Press Start 2P';font-size:22px;color:#FF6B4A;")}>{v.xp}</div>
          <div style={css('font-size:11px;font-weight:800;color:#8a8194;margin-top:4px;')}>XP</div>
        </div>
        <div style={css('flex:1;background:#fff;border:3px solid #201E2E;padding:14px;text-align:center;')}>
          <div style={css("font-family:'Press Start 2P';font-size:22px;color:#FF6B4A;")}>{v.streak}🔥</div>
          <div style={css('font-size:11px;font-weight:800;color:#8a8194;margin-top:4px;')}>STREAK</div>
        </div>
      </div>
      <div>
        <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;margin-bottom:10px;")}>BADGES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.badgeList.map((b: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: b.unlocked ? '#F3FBF8' : '#fff', border: '2px solid ' + (b.unlocked ? '#2DD4A7' : '#c9c2b8'), padding: '10px 14px', opacity: b.unlocked ? 1 : 0.5 }}>
              <div style={{ fontSize: 18 }}>{b.unlocked ? '🏅' : '🔒'}</div>
              <div style={{ fontSize: 13, fontWeight: b.unlocked ? 800 : 700, color: b.unlocked ? '#201E2E' : '#8a8194' }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
      {v.ptHistory && v.ptHistory.length > 0 && (
        <div>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;margin-bottom:10px;")}>TEST SCORES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {v.ptHistory.slice(-5).reverse().map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '2px solid #201E2E', padding: '8px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{h.date}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: h.score >= h.total * 0.7 ? '#1a9c77' : '#c92c30' }}>{h.score}/{h.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({ v }: any) {
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 0 }}>
        <button onClick={v.setCalendarModeStudied} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: v.calStudiedColor, background: v.calStudiedBg, border: '3px solid #201E2E', padding: 9, cursor: 'pointer', borderRight: 0 }}>MARK STUDIED</button>
        <button onClick={v.setCalendarModeTest} style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 900, fontSize: 12, color: v.calTestColor, background: v.calTestBg, border: '3px solid #201E2E', padding: 9, cursor: 'pointer' }}>SET TEST DAY</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={v.calMonthPrev} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 8px' }}>◀</button>
        <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;")}>{v.calMonthLabel}</div>
        <button onClick={v.calMonthNext} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 8px' }}>▶</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {DOW.map((d: string) => <div key={d} style={css('text-align:center;font-size:10px;font-weight:800;color:#8a8194;padding:4px 0;')}>{d}</div>)}
        {v.calCells.map((cell: any, i: number) => (
          <div key={i} onClick={cell.empty ? undefined : cell.pick} style={{ cursor: cell.empty ? 'default' : 'pointer', minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cell.isTest ? '#FFC93C' : cell.isStudied ? '#2DD4A7' : '#fff', border: cell.isToday ? '2px solid #FF6B4A' : '1px solid #e8e2d6', fontWeight: cell.isToday ? 900 : 700, fontSize: 13, color: cell.isTest || cell.isStudied ? '#201E2E' : cell.isToday ? '#FF6B4A' : '#201E2E' }}>
            {cell.label}
          </div>
        ))}
      </div>
      <div style={css('font-size:12px;font-weight:700;color:#8a8194;')}>Test date: {v.testDateLabel}</div>
    </div>
  );
}

// ─── Material Tab ─────────────────────────────────────────────────────────────
function MaterialTab({ v }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={css('background:#fff;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;')}>
        <div>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;")}>CURRENT MATERIAL</div>
          <div style={css('font-size:14px;font-weight:800;color:#201E2E;margin-top:6px;')}>{v.currentTopic || 'No material yet'}</div>
        </div>
        <button onClick={v.goEditMaterial} style={css("font-family:'Nunito';font-weight:900;font-size:12px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;padding:8px 12px;cursor:pointer;white-space:nowrap;")}>EDIT</button>
      </div>
      {v.hasLibrary && (
        <div>
          <div style={css("font-family:'Press Start 2P';font-size:10px;color:#201E2E;margin-bottom:10px;")}>SAVED MATERIALS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {v.libraryRows.map((row: any, i: number) => (
              <div key={i} style={row.rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }} onClick={row.open}>
                  {row.notRenaming ? (
                    <>
                      <div style={css('font-size:13px;font-weight:800;color:#201E2E;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{row.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: row.badgeColor }}>{row.badge}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8194' }}>{row.detail}</div>
                      </div>
                    </>
                  ) : (
                    <input value={v.renameDraft} onChange={v.onRenameInput} style={css('width:100%;box-sizing:border-box;font-family:Nunito;font-size:13px;font-weight:700;padding:4px 8px;border:2px solid #201E2E;outline:none;background:#fff;')} autoFocus />
                  )}
                </div>
                {row.notRenaming ? (
                  <button onClick={row.rename} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4 }}>✏️</button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={v.cancelRename} style={css("font-family:'Nunito';font-weight:900;font-size:11px;color:#201E2E;background:#fff;border:2px solid #201E2E;padding:4px 8px;cursor:pointer;")}>✕</button>
                    <button onClick={v.saveRename} disabled={v.cantSaveRename} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 11, color: '#fff', background: v.cantSaveRename ? '#c9c2b8' : '#FF6B4A', border: '2px solid #201E2E', padding: '4px 8px', cursor: v.cantSaveRename ? 'default' : 'pointer' }}>SAVE</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={v.goEditMaterial} style={css("font-family:'Nunito';font-weight:900;font-size:14px;color:#fff;background:#7C5CFC;border:3px solid #201E2E;box-shadow:4px 4px 0 #201E2E;padding:14px;cursor:pointer;")}>+ ADD NEW MATERIAL</button>
    </div>
  );
}

// ─── Main App Screen ──────────────────────────────────────────────────────────
export function AppScreen({ v }: any) {
  return (
    <div data-screen-label="App" style={css('flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;position:relative;')}>
      {/* Header */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:3px solid #201E2E;background:#fff;flex-shrink:0;')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Chop16 />
          {v.notEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={css("font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;")}>Hey, {v.name}</div>
              {v.hasAge && <div style={css('font-size:10px;font-weight:800;color:#8a8194;')}>· {v.age}</div>}
              <button onClick={v.startEditName} style={{ fontFamily: 'Nunito', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>✏️</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="number" min="5" max="99" value={v.ageEditDraft} onChange={v.onAgeEditInput} style={css('width:46px;font-family:Nunito;font-weight:800;font-size:12px;padding:4px 6px;border:2px solid #201E2E;background:#fff;color:#201E2E;outline:none;')} />
              <input type="text" value={v.nameEditDraft} onChange={v.onNameEditInput} style={css('width:100px;font-family:Nunito;font-weight:800;font-size:12px;padding:4px 7px;border:2px solid #201E2E;background:#fff;color:#201E2E;outline:none;')} />
              <button onClick={v.saveNameEdit} disabled={v.cantSaveName} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 11, color: '#fff', background: v.nameSaveBg, border: '2px solid #201E2E', padding: '4px 8px', cursor: v.nameSaveCursor }}>SAVE</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={css('display:flex;align-items:center;gap:3px;background:#FFF3DE;border:2px solid #201E2E;padding:4px 7px;font-size:11px;font-weight:900;color:#201E2E;')}>🔥{v.streak}</div>
          <div style={css('display:flex;align-items:center;gap:3px;background:#EDE7FF;border:2px solid #201E2E;padding:4px 7px;font-size:11px;font-weight:900;color:#201E2E;')}>⭐{v.xp}</div>
          <button onClick={v.openRestart} style={css("font-family:'Nunito';font-weight:900;font-size:11px;color:#fff;background:#FF5A5F;border:2px solid #201E2E;padding:4px 9px;cursor:pointer;")}>RESTART</button>
        </div>
      </div>

      {/* Method chip row */}
      <div style={css('display:flex;gap:6px;padding:10px 12px;overflow-x:auto;flex-shrink:0;border-bottom:2px solid #201E2E;background:#FFF9EF;')}>
        {v.methodChips.map((chip: any, i: number) => (
          <button key={i} onClick={chip.pick} style={{ flexShrink: 0, fontFamily: 'Nunito', fontWeight: 900, fontSize: 11, color: chip.color, background: chip.isTopPick ? '#FF6B4A' : chip.bg, border: chip.isTopPick ? '2px solid #201E2E' : '2px solid #201E2E', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: (chip.badge || chip.isTopPick) ? '2px 2px 0 #201E2E' : 'none' }}>
            {chip.isTopPick ? '⭐ ' : chip.badge ? '✓ ' : ''}{chip.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={css('flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;')}>
        {v.tabToday && <TodayTab v={v} />}
        {v.tabStudy && (
          <>
            {!v.activeMethod && (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#8a8194', textAlign: 'center', paddingTop: 20 }}>Pick a method from the chips above to start studying.</div>
            )}
            {v.isActiveRecall && <ActiveRecall v={v} />}
            {v.isBlurting && <Blurting v={v} />}
            {v.isPomodoro && <Pomodoro v={v} />}
            {v.isPractice && <PracticeTesting v={v} />}
            {v.isElaborative && <ElaborativeInterrogation v={v} />}
            {v.isConcrete && <ConcreteExamples v={v} />}
            {v.isSelfExplanation && <SelfExplanation v={v} />}
            {v.isProblemSets && <ProblemSets v={v} />}
            {v.isFeynman && <Feynman v={v} />}
            {v.isChunking && <Chunking v={v} />}
          </>
        )}
        {v.tabProgress && <ProgressTab v={v} />}
        {v.tabCalendar && <CalendarTab v={v} />}
        {v.tabMaterial && <MaterialTab v={v} />}
      </div>

      {/* Bottom nav */}
      <div style={css('display:grid;grid-template-columns:repeat(5,1fr);border-top:3px solid #201E2E;flex-shrink:0;background:#fff;')}>
        {[
          { label: '🏠', sub: 'TODAY', bg: v.navTodayBg, color: v.navTodayColor, fn: v.goTabToday },
          { label: '📚', sub: 'STUDY', bg: v.navStudyBg, color: v.navStudyColor, fn: v.goTabStudy },
          { label: '📈', sub: 'PROGRESS', bg: v.navProgressBg, color: v.navProgressColor, fn: v.goTabProgress },
          { label: '📅', sub: 'CALENDAR', bg: v.navCalendarBg, color: v.navCalendarColor, fn: v.goTabCalendar },
          { label: '📝', sub: 'MATERIAL', bg: v.navMaterialBg, color: v.navMaterialColor, fn: v.goTabMaterial },
        ].map((tab: any, i: number) => (
          <button key={i} onClick={tab.fn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '10px 4px', background: tab.bg, border: 'none', borderRight: i < 4 ? '2px solid #201E2E' : 'none', cursor: 'pointer' }}>
            <div style={{ fontSize: 18 }}>{tab.label}</div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: tab.color, lineHeight: 1.4, letterSpacing: 0.5 }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* Ask age overlay */}
      {v.askAgeOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(32,30,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={css('width:100%;max-width:300px;background:#fff;border:3px solid #201E2E;box-shadow:5px 5px 0 #201E2E;padding:20px;display:flex;flex-direction:column;gap:14px;')}>
            <div style={css("font-family:'Nunito';font-weight:900;font-size:15px;color:#201E2E;")}>How old are you? Chop adjusts its explanations.</div>
            <input type="number" min="5" max="99" value={v.ageDraft} onChange={v.onAgeInput} placeholder="e.g. 16" style={css('width:100%;box-sizing:border-box;font-family:Nunito;font-size:15px;font-weight:700;padding:10px 12px;border:3px solid #201E2E;outline:none;background:#fff;')} />
            <button onClick={v.saveAskedAge} disabled={v.cantSaveAskedAge} style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 14, color: '#fff', background: v.askAgeBtnBg, border: '3px solid #201E2E', boxShadow: '3px 3px 0 #201E2E', padding: 12, cursor: v.askAgeBtnCursor }}>SAVE →</button>
          </div>
        </div>
      )}

      {/* Math notice overlay */}
      {v.mathNoticeOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(32,30,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={css('width:100%;max-width:380px;background:#fff;border:3px solid #201E2E;box-shadow:6px 6px 0 #201E2E;padding:20px;display:flex;flex-direction:column;gap:14px;')}>
            <div style={css("font-family:'Press Start 2P';font-size:11px;color:#201E2E;")}>MATH MATERIAL DETECTED</div>
            <div style={css('font-size:13px;font-weight:700;color:#463f52;line-height:1.5;')}>Chop found math or science content. These methods work best:</div>
            {v.mathMethodRows.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, background: '#FFF9EF', border: '2px solid #FFC93C', padding: '10px 12px' }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: '#FF6B4A', flexShrink: 0 }}>{r.rank}.</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13, color: '#201E2E' }}>{r.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8194', marginTop: 3, lineHeight: 1.4 }}>{r.why}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={v.closeMathNotice} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#201E2E;background:#fff;border:3px solid #201E2E;padding:11px;cursor:pointer;")}>KEEP CURRENT</button>
              <button onClick={v.acceptMathMethods} style={css("flex:1;font-family:'Nunito';font-weight:900;font-size:13px;color:#fff;background:#FF6B4A;border:3px solid #201E2E;box-shadow:3px 3px 0 #201E2E;padding:11px;cursor:pointer;")}>SWITCH TO MATH</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
