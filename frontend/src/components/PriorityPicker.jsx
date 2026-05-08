export default function PriorityPicker({ value, onChange }) {
  const priorities = [
    {
      id: 'low',
      label: 'Low',
      selectedClass: 'bg-priority-low-bg border-[#1e40af] text-priority-low-text',
    },
    {
      id: 'medium',
      label: 'Medium',
      selectedClass: 'bg-priority-mid-bg border-[#d97706] text-priority-mid-text',
    },
    {
      id: 'high',
      label: 'High',
      selectedClass: 'bg-priority-high-bg border-[#b91c1c] text-priority-high-text',
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {priorities.map((p) => {
        const isSelected = value === p.id;
        return (
          <div
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex-1 rounded-input border px-3 py-2 text-xs font-sans font-medium text-center cursor-pointer transition-all duration-150 ${
              isSelected ? p.selectedClass : 'bg-cream border-border text-ink/50 hover:bg-sand'
            }`}
          >
            {p.label}
          </div>
        );
      })}
    </div>
  );
}
