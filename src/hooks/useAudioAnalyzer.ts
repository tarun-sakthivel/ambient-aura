import { useCallback, useRef, useState } from "react";

export interface AudioData {
  spectralCentroid: number; // 0-1 normalized
  energy: number; // 0-1 normalized
  isOnset: boolean; // sudden energy spike
}

interface AnalyzerSettings {
  sensitivity: number; // 0.1 - 3.0
  fftSize: number;
}

const DEFAULT_SETTINGS: AnalyzerSettings = {
  sensitivity: 1.5,
  fftSize: 2048,
};

export function useAudioAnalyzer() {
  const [isActive, setIsActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({
    spectralCentroid: 0,
    energy: 0,
    isOnset: false,
  });

  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const prevEnergyRef = useRef(0);
  const settingsRef = useRef<AnalyzerSettings>(DEFAULT_SETTINGS);
  const streamRef = useRef<MediaStream | null>(null);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const { sensitivity } = settingsRef.current;
    const sampleRate = contextRef.current?.sampleRate ?? 44100;

    // Spectral Centroid: weighted average of frequencies
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const magnitude = dataArray[i];
      const frequency = (i * sampleRate) / (bufferLength * 2);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }

    const centroidHz = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    // Normalize to 0-1 (most mic content is 80-8000Hz)
    const normalizedCentroid = Math.min(1, Math.max(0, (centroidHz - 80) / 7920));

    // Energy: RMS of frequency data
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = dataArray[i] / 255;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const energy = Math.min(1, rms * sensitivity * 3);

    // Onset detection: sudden energy increase
    const energyDelta = energy - prevEnergyRef.current;
    const isOnset = energyDelta > 0.15 * (1 / sensitivity) && energy > 0.3;
    prevEnergyRef.current = energy;

    setAudioData({
      spectralCentroid: normalizedCentroid,
      energy,
      isOnset,
    });

    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = settingsRef.current.fftSize;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      contextRef.current = context;
      analyserRef.current = analyser;

      setIsActive(true);
      rafRef.current = requestAnimationFrame(analyze);

      // Attempt torch for mobile strobe
      tryEnableTorch(stream);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [analyze]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    contextRef.current?.close();
    contextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsActive(false);
    setAudioData({ spectralCentroid: 0, energy: 0, isOnset: false });
    prevEnergyRef.current = 0;
  }, []);

  const updateSensitivity = useCallback((value: number) => {
    settingsRef.current = { ...settingsRef.current, sensitivity: value };
  }, []);

  return { audioData, isActive, start, stop, updateSensitivity };
}

async function tryEnableTorch(stream: MediaStream) {
  try {
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities() as any;
      if (capabilities?.torch) {
        await track.applyConstraints({ advanced: [{ torch: true } as any] });
      }
    }
  } catch {
    // Torch not available, fallback to screen flash
  }
}
