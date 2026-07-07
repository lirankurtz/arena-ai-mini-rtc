interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-900 text-red-100 px-6 py-3 rounded-lg flex justify-between items-center gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-100 hover:text-red-50 font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}
