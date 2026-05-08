/**
 * StatCard — displays a large number with a label below.
 * @param {string}  label   - e.g. "Total Tasks"
 * @param {number}  value   - numeric stat
 * @param {string}  [accent] - Tailwind text color class for value, e.g. "text-terracotta"
 */
export default function StatCard({ label, value, accent = 'text-ink' }) {
  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-card flex flex-col gap-1">
      <span className={`text-3xl font-serif font-semibold ${accent}`}>
        {value ?? 0}
      </span>
      <span className="text-xs font-sans text-ink/55 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
