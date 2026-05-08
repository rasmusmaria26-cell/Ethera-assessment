import { useState, useEffect } from 'react';

// Easing function: easeOutQuart
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

export default function StatCard({ label, value, accent, leftAccentColor }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 800; // ms
    let startTime = null;
    let rafId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);
      
      const currentVal = Math.round(easeOutQuart(t) * value);
      setDisplayValue(currentVal);

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const borderStyle = leftAccentColor
    ? { borderLeft: `3px solid ${leftAccentColor}` }
    : {};

  return (
    <div
      className="bg-surface border border-border rounded-card p-5 shadow-card animate-fade-in"
      style={borderStyle}
    >
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-sans text-3xl font-medium text-ink mb-1">
            {displayValue}
          </h3>
          <p className="font-sans text-sm text-ink/60">{label}</p>
        </div>
        {accent && (
          <div className={`w-2 h-2 rounded-full ${accent}`}></div>
        )}
      </div>
    </div>
  );
}
