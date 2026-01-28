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
        rounded-2xl p-6 transition-all duration-300
        ${highlight ? "bg-terracotta text-ivory" : "bg-cream text-charcoal"}
      `}
    >
      <p
        className={`text-sm font-medium tracking-wide uppercase mb-1 ${highlight ? "text-ivory/70" : "text-slate"}`}
      >
        {label}
      </p>
      <p
        className={`text-3xl font-serif ${highlight ? "text-ivory" : "text-charcoal"}`}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={`text-sm mt-2 ${highlight ? "text-ivory/60" : "text-slate"}`}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
