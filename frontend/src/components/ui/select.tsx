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
    .filter((child): child is ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }> => isValidElement(child))
    .filter((child) => typeof child.type === "string" && child.type === "option")
    .map((child) => ({
      label: optionLabel(child.props.children),
      value: child.props.value !== undefined ? String(child.props.value) : "",
      disabled: Boolean(child.props.disabled),
    }));
}

export const Select = forwardRef<HTMLInputElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
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
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[14px] border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-ink-950 outline-none transition hover:border-slate-400 focus:border-ink-700 focus:ring-2 focus:ring-ink-700/10 disabled:cursor-not-allowed disabled:opacity-60",
          isOpen && "border-ink-700 ring-2 ring-ink-700/10",
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-500")}>{selectedOption?.label ?? "Select an option"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition", isOpen && "rotate-180 text-ink-800")} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[90] overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(16,32,51,0.16)]">
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto p-2">
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <button
                  key={`${name ?? "select"}-${option.value}`}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    emitChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm transition",
                    option.disabled
                      ? "cursor-not-allowed text-slate-400"
                      : selected
                        ? "bg-ink-900 text-white"
                        : "text-ink-950 hover:bg-slate-100",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});
