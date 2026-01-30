import { useState, useRef, useEffect, useId, useCallback } from "react";
import { Download, Printer, FileSpreadsheet, FileText } from "lucide-react";

interface ExportControlsProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ExportControls({ onExportCSV, onExportExcel, onPrint }: ExportControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const menuItems = [
    { label: "Excel (.xlsx)", icon: FileSpreadsheet, action: onExportExcel },
    { label: "CSV (.csv)", icon: FileText, action: onExportCSV },
  ];

  const closeMenu = useCallback(() => {
    setShowDropdown(false);
    setFocusedIndex(0);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus first item when menu opens
  useEffect(() => {
    if (showDropdown) {
      menuItemRefs.current[0]?.focus();
    }
  }, [showDropdown]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setShowDropdown(true);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          menuItemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          menuItemRefs.current[next]?.focus();
          return next;
        });
        break;
      case "Home":
        event.preventDefault();
        setFocusedIndex(0);
        menuItemRefs.current[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        setFocusedIndex(menuItems.length - 1);
        menuItemRefs.current[menuItems.length - 1]?.focus();
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative" ref={dropdownRef}>
        <button
          ref={triggerRef}
          onClick={() => setShowDropdown(!showDropdown)}
          onKeyDown={handleTriggerKeyDown}
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
            onKeyDown={handleMenuKeyDown}
            className="absolute right-0 top-full mt-1 bg-cream border border-sand rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          >
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                ref={(el) => { menuItemRefs.current[index] = el; }}
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => {
                  item.action();
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-sand focus:bg-sand focus:outline-none transition-colors"
              >
                <item.icon size={14} aria-hidden="true" />
                {item.label}
              </button>
            ))}
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
