import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface DrawPadHandle {
  /** PNG of the canvas as raw base64 (no data: prefix), or null if empty/unavailable. */
  toPngBase64: () => string | null;
  clear: () => void;
}

interface Props {
  /** Called whenever the pad flips between empty and drawn-on. */
  onDirtyChange?: (dirty: boolean) => void;
  height?: number;
}

const INK = '#201E2E';

/**
 * Web-only handwriting canvas for Problem Sets' DRAW mode (the prototype
 * had one; Chop marks a photo of the strokes via ps-mark-drawing). On
 * native it renders a friendly "use the website" note — same policy as
 * PDF import — until the phone app ships with a native canvas.
 */
const DrawPad = forwardRef<DrawPadHandle, Props>(function DrawPad({ onDirtyChange, height = 320 }, ref) {
  const colors = useColors();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const dirtyRef = useRef(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const setDirty = (d: boolean) => {
    if (dirtyRef.current !== d) {
      dirtyRef.current = d;
      onDirtyChange?.(d);
    }
  };

  useImperativeHandle(ref, () => ({
    toPngBase64: () => {
      const canvas = canvasRef.current;
      if (!canvas || !dirtyRef.current) return null;
      try {
        return canvas.toDataURL('image/png').split(',')[1] ?? null;
      } catch {
        return null;
      }
    },
    clear: () => clearCanvas(),
  }));

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth || 600;
    canvas.width = w * scale;
    canvas.height = height * scale;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFrom = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const stroke = (e: React.PointerEvent, start: boolean) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointFrom(e);
    ctx.strokeStyle = toolRef.current === 'pen' ? INK : '#ffffff';
    ctx.lineWidth = toolRef.current === 'pen' ? 2.5 : 22;
    if (start) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y + 0.1);
    } else {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (toolRef.current === 'pen') setDirty(true);
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.nativeNote, { borderColor: colors.borderLight }]}>
        <Feather name="edit-3" size={18} color={colors.muted} />
        <Text style={[styles.nativeNoteText, { color: colors.muted }]}>
          Drawing arrives with the phone app — use the website to draw your working for now.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.toolRow}>
        <Pressable
          onPress={() => setTool('pen')}
          style={[styles.toolBtn, { borderColor: colors.dark, backgroundColor: tool === 'pen' ? colors.dark : colors.card }]}>
          <Feather name="edit-2" size={13} color={tool === 'pen' ? '#fff' : colors.dark} />
          <Text style={[styles.toolText, { color: tool === 'pen' ? '#fff' : colors.dark }]}>PEN</Text>
        </Pressable>
        <Pressable
          onPress={() => setTool('eraser')}
          style={[styles.toolBtn, { borderColor: colors.dark, backgroundColor: tool === 'eraser' ? colors.dark : colors.card }]}>
          <Feather name="square" size={13} color={tool === 'eraser' ? '#fff' : colors.dark} />
          <Text style={[styles.toolText, { color: tool === 'eraser' ? '#fff' : colors.dark }]}>ERASER</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={clearCanvas} style={[styles.toolBtn, { borderColor: colors.dark, backgroundColor: colors.card }]}>
          <Feather name="trash-2" size={13} color={colors.dark} />
          <Text style={[styles.toolText, { color: colors.dark }]}>CLEAR</Text>
        </Pressable>
      </View>
      <div
        ref={hostRef}
        style={{ border: `3px solid ${INK}`, background: '#fff', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            drawing.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            stroke(e, true);
          }}
          onPointerMove={(e) => {
            if (drawing.current) stroke(e, false);
          }}
          onPointerUp={() => { drawing.current = false; }}
          onPointerCancel={() => { drawing.current = false; }}
          style={{ display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </View>
  );
});

export default DrawPad;

const styles = StyleSheet.create({
  toolRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 2.5, paddingVertical: 8, paddingHorizontal: 14,
  },
  toolText: { fontWeight: '900', fontSize: 12 },
  nativeNote: {
    borderWidth: 2.5, borderStyle: 'dashed', padding: 20,
    alignItems: 'center', gap: 8,
  },
  nativeNoteText: { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 19 },
});
