// 知闲 · 웹 전용 음성 녹음기
// getUserMedia로 마이크 PCM을 받아 16kHz 모노 16-bit WAV로 인코딩한다.
// (서버 DashScope qwen3-asr-flash가 WAV를 바로 받으므로 ffmpeg/포맷 변환 불필요)

export type WavRecorder = { stop: () => Promise<Blob>; cancel: () => void };

export function voiceSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const w = window as any;
  const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasCtx = !!(w.AudioContext || w.webkitAudioContext);
  return hasMedia && hasCtx;
}

export async function startWavRecording(): Promise<WavRecorder> {
  const w = window as any;
  const AC = w.AudioContext || w.webkitAudioContext;
  const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } as any,
  });
  const ctx = new AC();
  if (ctx.state === 'suspended' && ctx.resume) {
    try { await ctx.resume(); } catch { /* ignore */ }
  }
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (e: any) => {
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(ctx.destination);
  const inRate: number = ctx.sampleRate || 48000;

  const teardown = () => {
    try { processor.disconnect(); } catch { /* ignore */ }
    try { source.disconnect(); } catch { /* ignore */ }
    try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    try { ctx.close(); } catch { /* ignore */ }
  };

  return {
    cancel: teardown,
    stop: async (): Promise<Blob> => {
      teardown();
      let len = 0;
      for (const c of chunks) len += c.length;
      const merged = new Float32Array(len);
      let off = 0;
      for (const c of chunks) { merged.set(c, off); off += c.length; }
      const down = downsample(merged, inRate, 16000);
      return encodeWav(down, 16000);
    },
  };
}

function downsample(buf: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return buf;
  const ratio = inRate / outRate;
  const outLen = Math.floor(buf.length / ratio);
  const out = new Float32Array(outLen);
  let oi = 0;
  let ii = 0;
  while (oi < outLen) {
    const next = Math.floor((oi + 1) * ratio);
    let sum = 0;
    let cnt = 0;
    for (; ii < next && ii < buf.length; ii++) { sum += buf[ii]; cnt++; }
    out[oi++] = cnt ? sum / cnt : 0;
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const ab = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ws(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}
