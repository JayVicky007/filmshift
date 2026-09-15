type RatingRingProps = {
  rating: number | null | undefined;
  size?: "sm" | "md";
};

function getRatingColor(rating: number | null | undefined) {
  if (!rating || rating <= 0) {
    return "#94a3b8";
  }

  if (rating >= 7) {
    return "#22c55e";
  }

  if (rating >= 5) {
    return "#facc15";
  }

  return "#f97316";
}

export default function RatingRing({ rating, size = "sm" }: RatingRingProps) {
  const dimension = size === "md" ? 76 : 52;
  const strokeWidth = size === "md" ? 6 : 5;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedRating = rating && rating > 0 ? Math.min(rating, 10) / 10 : 0;
  const scoreLabel = rating && rating > 0 ? rating.toFixed(1) : "--";
  const color = getRatingColor(rating);

  return (
    <div
      className="relative shrink-0 rounded-full bg-slate-950/90"
      style={{ width: dimension, height: dimension }}
      aria-label={`Audience rating ${scoreLabel} out of 10`}
    >
      <svg
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - normalizedRating)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {scoreLabel}
      </span>
    </div>
  );
}
