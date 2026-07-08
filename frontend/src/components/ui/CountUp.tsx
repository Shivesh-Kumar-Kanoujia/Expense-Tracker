import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({ value, decimals = 0, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0.9 1", "1 0.1"],
  });
  const count = useTransform(scrollYProgress, [0, 1], [0, value]);
  const display = useTransform(count, (v) => `${v.toFixed(decimals)}${suffix}`);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
