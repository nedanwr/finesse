import { Download, Printer } from "lucide-react";

interface ExportControlsProps {
  onExportCSV: () => void;
  onPrint: () => void;
}

export function ExportControls({ onExportCSV, onPrint }: ExportControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onExportCSV}
        className="p-1.5 text-slate hover:text-charcoal transition-colors"
        title="Export as CSV"
      >
        <Download size={16} />
      </button>
      <button
        onClick={onPrint}
        className="p-1.5 text-slate hover:text-charcoal transition-colors"
        title="Print / Save as PDF"
      >
        <Printer size={16} />
      </button>
    </div>
  );
}
