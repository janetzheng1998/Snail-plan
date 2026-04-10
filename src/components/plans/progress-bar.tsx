type ProgressBarProps = {
  percent: number;
};

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-moss-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-moss-300 via-moss-600 to-moss-700 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
