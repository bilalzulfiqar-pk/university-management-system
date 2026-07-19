import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEventHandler,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type OptionItem = {
  label: string;
  value: string;
  disabled: boolean;
};

function optionLabel(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      return "";
    })
    .join("")
    .trim();
}

function parseOptions(children: ReactNode): OptionItem[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }> =>
        isValidElement(child),
    )
    .filter((child) => typeof child.type === "string" && child.type === "option")
    .map((child) => ({
      label: optionLabel(child.props.children),
      value: child.props.value !== undefined ? String(child.props.value) : "",
      disabled: Boolean(child.props.disabled),
    }));
}

export const Select = forwardRef<HTMLInputElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(
    { className, children, value, defaultValue, onChange, onBlur, name, disabled, required },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue !== undefined ? String(defaultValue) : "");

    const options = useMemo(() => parseOptions(children), [children]);
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? String(value ?? "") : internalValue;
    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("mousedown", handlePointerDown);
        window.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    const emitChange = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.({
        target: {
          name,
          value: nextValue,
        },
        currentTarget: {
          name,
          value: nextValue,
        },
      } as never);
    };

    const emitBlur = () => {
      onBlur?.({
        target: {
          name,
          value: selectedValue,
        },
        currentTarget: {
          name,
          value: selectedValue,
        },
      } as never);
    };

    const handleRootBlur: FocusEventHandler<HTMLDivElement> = (event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setIsOpen(false);
        emitBlur();
      }
    };

    return (
      <div ref={rootRef} className={cn("relative w-full", className)} onBlur={handleRootBlur}>
        <input ref={ref} type="hidden" name={name} value={selectedValue} required={required} />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-3 rounded-input border border-slate-300 bg-white px-3.5 text-left text-sm text-ink-900",
            "outline-none transition-smooth hover:border-slate-400",
            "focus:border-ink-600 focus:ring-2 focus:ring-ink-600/15",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            isOpen && "border-ink-600 ring-2 ring-ink-600/15",
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-slate-400")}>
            {selectedOption?.label ?? "Select an option"}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-400 transition-smooth", isOpen && "rotate-180 text-ink-700")}
          />
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[90] animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-dropdown">
            <div className="max-h-64 overflow-y-auto p-1.5" role="listbox">
              {options.map((option) => {
                const selected = option.value === selectedValue;
                return (
                  <button
                    key={`${name ?? "select"}-${option.value}`}
                    type="button"
                    disabled={option.disabled}
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      if (option.disabled) return;
                      emitChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-smooth",
                      option.disabled
                        ? "cursor-not-allowed text-slate-400"
                        : selected
                          ? "bg-ink-50 font-medium text-ink-900"
                          : "text-ink-800 hover:bg-slate-50",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-ink-700" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
