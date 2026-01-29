interface ResultCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  subtext?: string;
}

export function ResultCard({
  label,
  value,
  highlight,
  subtext,
}: ResultCardProps) {
  return (
    <div
      className={`
        rounded-xl p-4 transition-all duration-300
        ${highlight ? "bg-terracotta text-ivory" : "bg-cream text-charcoal"}
      `}
    >
      <p
        className={`text-xs font-medium tracking-wide uppercase mb-0.5 ${highlight ? "text-ivory/70" : "text-slate"}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-serif ${highlight ? "text-ivory" : "text-charcoal"}`}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={`text-xs mt-1 ${highlight ? "text-ivory/60" : "text-slate"}`}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
