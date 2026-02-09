import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { getVisualizerColor } from "@/lib/colorMapping";
import { SettingsDrawer } from "@/components/SettingsDrawer";

const STROBE_DURATION = 60; // ms

const Index = () => {
  const { audioData, isActive, start, stop, updateSensitivity } = useAudioAnalyzer();
  const [transitionSpeed, setTransitionSpeed] = useState(1.2);
  const [sensitivity, setSensitivity] = useState(1.5);
  const [isStrobe, setIsStrobe] = useState(false);
  const strobeTimeoutRef = useRef<number>(0);
  const [bgColor, setBgColor] = useState("hsl(0, 0%, 4%)");

  // Handle strobe on onset
  useEffect(() => {
    if (audioData.isOnset && isActive) {
      setIsStrobe(true);
      clearTimeout(strobeTimeoutRef.current);
      strobeTimeoutRef.current = window.setTimeout(() => {
        setIsStrobe(false);
      }, STROBE_DURATION);
    }
  }, [audioData.isOnset, isActive]);

  // Update background color
  useEffect(() => {
    if (!isActive) return;
    const color = getVisualizerColor(audioData.spectralCentroid, audioData.energy, isStrobe);
    setBgColor(color);
  }, [audioData.spectralCentroid, audioData.energy, isStrobe, isActive]);

  // Update transition speed CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--transition-speed", `${transitionSpeed}s`);
  }, [transitionSpeed]);

  const handleSensitivityChange = useCallback(
    (value: number) => {
      setSensitivity(value);
      updateSensitivity(value);
    },
    [updateSensitivity]
  );

  const handleToggle = useCallback(() => {
    if (isActive) {
      stop();
      setBgColor("hsl(0, 0%, 4%)");
    } else {
      start();
    }
  }, [isActive, start, stop]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center visualizer-transition select-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* Settings drawer - always available */}
      <SettingsDrawer
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
        transitionSpeed={transitionSpeed}
        onTransitionSpeedChange={setTransitionSpeed}
      />

      {/* Start/Stop button */}
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.button
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            onClick={handleToggle}
            className="glass rounded-full px-10 py-5 flex items-center gap-3 cursor-pointer group"
          >
            <Mic className="w-5 h-5 text-foreground group-hover:text-foreground/80 transition-colors" />
            <span className="text-sm font-mono uppercase tracking-[0.3em] text-foreground">
              Start
            </span>
          </motion.button>
        ) : (
          <motion.button
            key="stop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 0.7 }}
            transition={{ duration: 0.4 }}
            onClick={handleToggle}
            className="fixed bottom-8 glass rounded-full px-6 py-3 cursor-pointer"
          >
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground">
              Stop
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Listening indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 left-6 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse-slow" />
            <span className="text-xs font-mono uppercase tracking-widest text-foreground/40">
              Listening
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
