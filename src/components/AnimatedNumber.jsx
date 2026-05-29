import React, { useEffect, useRef, useState } from 'react';

// AnimatedNumber: animates from 0 to `value` over `duration` ms.
export default function AnimatedNumber({ value = 0, duration = 1200, formatter = v => v, className = '' }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef();
  const startRef = useRef();
  const fromRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = display || 0;
    const start = performance.now();
    startRef.current = start;

    const target = Number(value) || 0;
    const dur = Math.max(1, Number(duration) || 1200);

    const tick = (ts) => {
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={className}>{formatter(display)}</span>
  );
}
