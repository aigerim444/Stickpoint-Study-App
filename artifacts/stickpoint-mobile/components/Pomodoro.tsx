import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { pomodoroChunks } from '@/lib/api';

interface Props {
  topic: string;
  notes: string;
  name: string;
  age: number | null;
  onComplete: () => void;
  onBack: () => void;
}

const WORK_SECS = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

type Phase = 'work' | 'shortBreak' | 'longBreak' | 'done';

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Pomodoro({ topic, notes, name, age, onComplete, onBack }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<Phase>('work');
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Server-chunked notes (one topic per round, bullets) + break fun facts.
  // Falls back to a raw newline split while loading or offline.
  const [aiChunks, setAiChunks] = useState<{ title: string; bullets: string[] }[] | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    pomodoroChunks(notes, { name, age }).then((r) => {
      if (!alive || !r) return;
      setAiChunks(r.chunks);
      setFunFacts(r.funFacts);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDuration = phase === 'work' ? WORK_SECS : phase === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
  const pct = (timeLeft / totalDuration) * 100;

  const phaseColor = phase === 'work' ? colors.primary : phase === 'shortBreak' ? colors.green : colors.yellow;
  const phaseLabel = phase === 'work' ? `ROUND ${round} — WORK` : phase === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((t) => {
      if (t <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase((p) => {
          if (p === 'work') {
            const nextRound = round + 1;
            if (round >= 4) {
              setRound(nextRound);
              setTimeLeft(LONG_BREAK);
              return 'longBreak';
            }
            setRound(nextRound);
            setTimeLeft(SHORT_BREAK);
            return 'shortBreak';
          }
          if (round > 4) {
            setFinished(true);
            return 'done';
          }
          setTimeLeft(WORK_SECS);
          return 'work';
        });
        return 0;
      }
      return t - 1;
    });
  }, [round]);

  const toggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setRunning(false);
    } else {
      timerRef.current = setInterval(tick, 1000);
      setRunning(true);
    }
  }, [running, tick]);

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === 'work') {
      const nextRound = round + 1;
      if (round >= 4) {
        setRound(nextRound);
        setPhase('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setRound(nextRound);
        setPhase('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else if (round > 4) {
      setFinished(true);
      setPhase('done');
    } else {
      setPhase('work');
      setTimeLeft(WORK_SECS);
    }
  }, [phase, round]);

  if (finished) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
        <View style={[styles.completeCard, { borderColor: colors.green }]}>
          <Text style={[styles.completeTitle, { color: colors.dark }]}>4 ROUNDS DONE!</Text>
          <Text style={[styles.completeBody, { color: colors.subtle }]}>You stayed focused for 2 hours. That's elite level.</Text>
        </View>
        <Pressable onPress={onComplete} style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.dark }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>FINISH SESSION</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Chunk of notes to show — server chunks when available, raw lines otherwise
  const fallbackChunks = notes.split('\n').filter(Boolean);
  const chunkIdx = Math.min(round - 1, (aiChunks?.length || fallbackChunks.length) - 1);
  const aiChunk = aiChunks?.[Math.max(0, chunkIdx)];
  const noteChunk = aiChunk
    ? aiChunk.bullets.map((b) => '•  ' + b.replace(/\*\*/g, '')).join('\n')
    : fallbackChunks[Math.max(0, chunkIdx)] || notes.slice(0, 300);
  const funFact = funFacts.length ? funFacts[(round - 1) % funFacts.length] : null;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
      {/* Phase badge */}
      <View style={[styles.phaseBadge, { backgroundColor: phaseColor + '22', borderColor: phaseColor }]}>
        <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>
      </View>

      {/* Timer circle */}
      <View style={[styles.timerContainer, { borderColor: phaseColor }]}>
        <Text style={[styles.timerText, { color: colors.dark }]}>{fmt(timeLeft)}</Text>
        <View style={[styles.timerTrack, { backgroundColor: colors.secondary }]}>
          <View style={[styles.timerFill, { width: `${pct}%`, backgroundColor: phaseColor }]} />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable onPress={toggle} style={[styles.playBtn, { backgroundColor: phaseColor, borderColor: colors.dark }]}>
          <Feather name={running ? 'pause' : 'play'} size={24} color="#fff" />
        </Pressable>
        <Pressable onPress={skip} style={[styles.skipBtn, { borderColor: colors.dark }]}>
          <Feather name="skip-forward" size={20} color={colors.dark} />
        </Pressable>
      </View>

      {/* Current study chunk */}
      {phase === 'work' && (
        <View style={[styles.noteCard, { borderColor: colors.dark }]}>
          <Text style={[styles.noteLabel, { color: colors.muted }]}>
            {aiChunk ? aiChunk.title.toUpperCase() : 'FOCUS ON THIS'}
          </Text>
          <Text style={[styles.noteText, { color: colors.dark }]}>{noteChunk}</Text>
        </View>
      )}
      {phase !== 'work' && (
        <View style={[styles.breakCard, { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
          <Text style={[styles.breakLabel, { color: colors.green }]}>BREAK TIME</Text>
          <Text style={[styles.breakBody, { color: colors.dark }]}>Step away from your screen. Breathe. No phones.</Text>
          {!!funFact && (
            <Text style={[styles.breakBody, { color: colors.dark }]}>💡 {funFact}</Text>
          )}
        </View>
      )}

      <Text style={[styles.roundInfo, { color: colors.muted }]}>Round {Math.min(round - 1, 4)} of 4 complete</Text>

      <Pressable onPress={onBack} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.muted} />
        <Text style={[styles.backLinkText, { color: colors.muted }]}>back to methods</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, alignItems: 'center' },
  phaseBadge: { borderWidth: 2, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'center' },
  phaseLabel: { fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  timerContainer: {
    borderWidth: 3, padding: 32, alignItems: 'center', gap: 16, width: '100%',
    boxShadow: '5px 5px 0px #201E2E',
  },
  timerText: { fontSize: 56, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerTrack: { width: '100%', height: 10, borderWidth: 2, borderColor: '#201E2E', overflow: 'hidden' },
  timerFill: { height: '100%' },
  controls: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  playBtn: { borderWidth: 3, width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  skipBtn: { borderWidth: 3, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  noteCard: { width: '100%', borderWidth: 3, padding: 16, gap: 8 },
  noteLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  noteText: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  breakCard: { width: '100%', borderWidth: 2, padding: 16, gap: 6 },
  breakLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  breakBody: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  roundInfo: { fontSize: 11, fontWeight: '800' },
  completeCard: { borderWidth: 3, padding: 24, alignItems: 'center', gap: 8, width: '100%' },
  completeTitle: { fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  completeBody: { fontWeight: '700', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn: {
    width: '100%', borderWidth: 3, padding: 15, alignItems: 'center',
    boxShadow: '4px 4px 0px #201E2E',
  },
  btnText: { fontWeight: '900', fontSize: 15 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { fontSize: 12, fontWeight: '700' },
});
