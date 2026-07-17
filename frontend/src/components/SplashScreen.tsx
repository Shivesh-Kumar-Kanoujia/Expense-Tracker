import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const DURATION = 0.95;
const EXIT_DURATION = 0.4;

function useReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const reduced = useReducedMotion();

  const finish = useCallback(() => {
    setFadeOut(true);
    setTimeout(onComplete, EXIT_DURATION * 1000);
  }, [onComplete]);

  useEffect(() => {
    if (reduced) {
      onComplete();
      return;
    }
    import("../pages/Dashboard");
    const timer = setTimeout(finish, DURATION * 1000);
    return () => clearTimeout(timer);
  }, [reduced, finish]);

  if (reduced) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={fadeOut ? { opacity: 0, scale: 1.02, filter: "blur(4px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: EXIT_DURATION, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg"
    >
      {/* Radial glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.04) 40%, transparent 60%)",
        }}
      />

      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="relative w-48 h-48 md:w-64 md:h-64"
          initial={{ opacity: 0 }}
          animate={fadeOut ? { opacity: 0.3, scale: 0.95 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg
            viewBox="0 0 192 192"
            className="absolute inset-0 w-full h-full"
            fill="none"
            aria-hidden="true"
          >
            <motion.rect
              x="2"
              y="2"
              width="188"
              height="188"
              rx="16"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.02 }}
            />

            <g className="text-accent" transform="translate(48, 146)">
              <motion.rect
                x="0"
                y={-18}
                width="14"
                height="18"
                rx="3"
                fill="currentColor"
                opacity="0.55"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.08, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "50% 100%" }}
              />
              <motion.rect
                x="22"
                y={-28}
                width="14"
                height="28"
                rx="3"
                fill="currentColor"
                opacity="0.75"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.12, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "50% 100%" }}
              />
              <motion.rect
                x="44"
                y={-38}
                width="14"
                height="38"
                rx="3"
                fill="currentColor"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.16, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "50% 100%" }}
              />
            </g>

            <motion.path
              d="M 54 130 L 72 118 L 84 124 L 100 108 L 114 114 L 130 102"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            />

            <motion.g
              className="text-accent"
              initial={{ y: -20, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 13,
                delay: 0.35,
              }}
            >
              {/* Micro-settle bounce after coin lands */}
              <motion.g
                animate={{
                  y: [0, -2, 0],
                  scale: [1, 1.01, 1],
                }}
                transition={{
                  duration: 0.2,
                  delay: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <circle cx="142" cy="94" r="8" fill="currentColor" />
                {/* Shimmer glow pulse on the dollar circle */}
                <motion.circle
                  cx="142"
                  cy="94"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.4, 1.8] }}
                  transition={{
                    duration: 0.45,
                    delay: 0.5,
                    ease: "easeOut",
                    times: [0, 0.4, 1],
                  }}
                />
                <text
                  x="142"
                  y="97"
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="system-ui"
                >
                  $
                </text>
              </motion.g>
            </motion.g>
          </svg>

          <motion.img
            layoutId="app-logo"
            src="/logo-Expense2.png"
            alt="Expense Tracker"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 object-contain pointer-events-none"
            style={{ willChange: "transform" }}
          />
        </motion.div>

        {/* Brand text reveal */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={fadeOut ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: fadeOut ? 0 : 0.4 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-text tracking-tight">
              Expense Tracker
            </h1>
            <motion.p
              className="text-sm text-text-muted mt-1.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: fadeOut ? 0 : 0.7, y: 0 }}
              transition={{ duration: 0.25, delay: fadeOut ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            Smart spending, simplified
          </motion.p>
        </motion.div>

        {/* Loading indicator dots */}
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: fadeOut ? 0 : 1 }}
            transition={{ duration: 0.25, delay: fadeOut ? 0 : 0.65 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
