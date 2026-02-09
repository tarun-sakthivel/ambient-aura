import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface SettingsDrawerProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  transitionSpeed: number;
  onTransitionSpeedChange: (value: number) => void;
}

export function SettingsDrawer({
  sensitivity,
  onSensitivityChange,
  transitionSpeed,
  onTransitionSpeedChange,
}: SettingsDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Subtle trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-50 glass rounded-full p-3 opacity-30 hover:opacity-80 transition-opacity duration-300"
        aria-label="Settings"
      >
        <Settings className="w-4 h-4 text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/40"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 glass border-l border-border p-8 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                  Settings
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Sensitivity — {sensitivity.toFixed(1)}
                  </label>
                  <Slider
                    value={[sensitivity]}
                    onValueChange={([v]) => onSensitivityChange(v)}
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How reactive the colors are to audio input
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Transition — {transitionSpeed.toFixed(1)}s
                  </label>
                  <Slider
                    value={[transitionSpeed]}
                    onValueChange={([v]) => onTransitionSpeedChange(v)}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How quickly the background color shifts
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ambient Visualizer uses your microphone to analyze audio frequencies in real-time. All processing happens locally — no data is sent anywhere.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
