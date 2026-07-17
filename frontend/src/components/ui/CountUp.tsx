import { useRef, useEffect } from "react";
import { motion, useSpring, useInView, useMotionValue, useTransform } from "framer-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({ value, decimals = 0, suffix = "", className, duration = 1.2 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 60,
    damping: 20,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (v) => `${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
