import { useState, useRef, useEffect, useId } from "react";
import { Download, Printer, FileSpreadsheet, FileText } from "lucide-react";

interface ExportControlsProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ExportControls({ onExportCSV, onExportExcel, onPrint }: ExportControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          aria-haspopup="menu"
          aria-expanded={showDropdown}
          aria-controls={menuId}
          aria-label="Download options"
          className="p-1.5 text-slate hover:text-charcoal transition-colors"
        >
          <Download size={16} />
        </button>

        {showDropdown && (
          <div
            id={menuId}
            role="menu"
            aria-label="Export formats"
            className="absolute right-0 top-full mt-1 bg-cream border border-sand rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          >
            <button
              role="menuitem"
              onClick={() => {
                onExportExcel();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-sand transition-colors"
            >
              <FileSpreadsheet size={14} aria-hidden="true" />
              Excel (.xlsx)
            </button>
            <button
              role="menuitem"
              onClick={() => {
                onExportCSV();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-sand transition-colors"
            >
              <FileText size={14} aria-hidden="true" />
              CSV (.csv)
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onPrint}
        aria-label="Print or save as PDF"
        className="p-1.5 text-slate hover:text-charcoal transition-colors"
      >
        <Printer size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
