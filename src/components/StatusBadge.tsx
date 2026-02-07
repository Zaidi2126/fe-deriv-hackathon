type StatusBadgeProps = {
  connected: boolean;
};

export function StatusBadge({ connected }: StatusBadgeProps) {
  return (
    <span
      className={
        connected
          ? 'inline-flex items-center rounded px-2.5 py-0.5 text-sm font-medium bg-green-100 text-green-800'
          : 'inline-flex items-center rounded px-2.5 py-0.5 text-sm font-medium bg-red-100 text-red-800'
      }
    >
      {connected ? 'Backend Connected' : 'Backend Offline'}
    </span>
  );
}
