import { useState, useRef, useEffect } from "react";
import { Download, Printer, FileSpreadsheet, FileText } from "lucide-react";

interface ExportControlsProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ExportControls({ onExportCSV, onExportExcel, onPrint }: ExportControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1.5 text-slate hover:text-charcoal transition-colors"
          title="Download"
        >
          <Download size={16} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-1 bg-cream border border-sand rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
            <button
              onClick={() => {
                onExportExcel();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-sand transition-colors"
            >
              <FileSpreadsheet size={14} />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => {
                onExportCSV();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-sand transition-colors"
            >
              <FileText size={14} />
              CSV (.csv)
            </button>
          </div>
        )}
      </div>

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
