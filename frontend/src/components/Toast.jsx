import { useToast } from '../context/ToastContext.jsx';

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        let bgClass = 'bg-sand';
        let borderClass = 'border-border';
        let textClass = 'text-ink/70';

        if (isSuccess) {
          bgClass = 'bg-terracotta/10';
          borderClass = 'border-l-[3px] border-l-terracotta border-transparent';
          textClass = 'text-terracotta';
        } else if (isError) {
          bgClass = 'bg-[#fef2f2]';
          borderClass = 'border-l-[3px] border-l-[#b91c1c] border-transparent';
          textClass = 'text-[#b91c1c]';
        }

        return (
          <div
            key={toast.id}
            className={`animate-slide-up w-full max-w-xs p-4 rounded-card border shadow-card font-sans text-[13px] font-medium transition-opacity duration-300 ${bgClass} ${borderClass} ${textClass}`}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
