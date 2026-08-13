import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { DialogProps } from "@radix-ui/react-dialog";

/* ─── Context ────────────────────────────────── */

interface CommandContextValue {
  search: string;
  setSearch: (v: string) => void;
  selectedIndex: number;
  totalItems: number;
  registerItem: () => number;
  onSelect: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommandContext(): CommandContextValue {
  const ctx = React.useContext(CommandContext);
  if (!ctx) throw new Error("Command components must be used within <Command>");
  return ctx;
}

/* ─── Command Root ────────────────────────────── */

interface CommandProps {
  children: React.ReactNode;
  className?: string;
  /** Called when user selects an item (keyboard or click) */
  onSelect?: (value: string) => void;
}

function Command({
  children,
  className,
  onSelect: onItemSelect,
}: CommandProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemCountRef = useRef(0);
  const itemRegistry = useRef<(() => void)[]>([]);

  const registerItem = useCallback(() => {
    const idx = itemCountRef.current++;
    const unregister = () => {
      // Items can unregister on unmount if needed
    };
    itemRegistry.current[idx] = unregister;
    return idx;
  }, []);

  const filteredTotalRef = useRef(0);

  const handleSelect = useCallback(
    (value: string) => {
      onItemSelect?.(value);
    },
    [onItemSelect],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const total = filteredTotalRef.current;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Enter is handled by CommandItem via data-selected attribute
    }
  }, []);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <CommandContext.Provider
      value={{
        search,
        setSearch,
        selectedIndex,
        totalItems: itemCountRef.current,
        registerItem,
        onSelect: handleSelect,
        handleKeyDown,
      }}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-950",
          className,
        )}
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
}
Command.displayName = "Command";

/* ─── CommandDialog ──────────────────────────── */

interface CommandDialogProps extends DialogProps {
  children: React.ReactNode;
}

function CommandDialog({ children, ...props }: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* ─── CommandInput ───────────────────────────── */

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, onValueChange, value: _value, ...props }, ref) => {
  const { search, setSearch, handleKeyDown } = useCommandContext();

  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onValueChange?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 border-0 ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
          className,
        )}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = "CommandInput";

/* ─── CommandList ────────────────────────────── */

function CommandList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // Filter children based on search, passing filterable text through value prop
  return (
    <div
      className={cn(
        "max-h-[300px] overflow-y-auto overflow-x-hidden",
        className,
      )}
      role="listbox"
      {...props}
    >
      {children}
    </div>
  );
}
CommandList.displayName = "CommandList";

/* ─── CommandEmpty ───────────────────────────── */

function CommandEmpty({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="py-6 text-center text-sm" {...props}>
      {children}
    </div>
  );
}
CommandEmpty.displayName = "CommandEmpty";

/* ─── CommandGroup ───────────────────────────── */

interface CommandGroupProps {
  children: React.ReactNode;
  heading?: string;
  className?: string;
}

function CommandGroup({ children, heading, className }: CommandGroupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden p-1 text-slate-950",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500",
        className,
      )}
      role="group"
    >
      {heading && <div cmdk-group-heading="">{heading}</div>}
      {children}
    </div>
  );
}
CommandGroup.displayName = "CommandGroup";

/* ─── CommandSeparator ───────────────────────── */

function CommandSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("-mx-1 h-px bg-slate-200", className)} {...props} />
  );
}
CommandSeparator.displayName = "CommandSeparator";

/* ─── CommandItem ────────────────────────────── */

interface CommandItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  value?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  (
    { className, value, onSelect: onItemSelect, disabled, children, ...props },
    ref,
  ) => {
    const {
      search,
      selectedIndex,
      registerItem,
      onSelect: ctxSelect,
    } = useCommandContext();
    const [index, setIndex] = useState(-1);
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const idx = registerItem();
      setIndex(idx);
    }, [registerItem]);

    // Filter by search
    const searchText = value || (typeof children === "string" ? children : "");
    const isVisible =
      !search || searchText.toLowerCase().includes(search.toLowerCase());

    const isSelected = index === selectedIndex;

    // Scroll into view when selected
    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.scrollIntoView({ block: "nearest" });
      }
    }, [isSelected]);

    // Listen for Enter key when selected
    useEffect(() => {
      if (!isSelected) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ctxSelect(value || searchText);
          onItemSelect?.(value || searchText);
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isSelected, value, searchText, ctxSelect, onItemSelect]);

    if (!isVisible) return null;

    return (
      <div
        ref={itemRef}
        role="option"
        aria-selected={isSelected}
        data-selected={isSelected ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        onClick={() => {
          if (!disabled) {
            ctxSelect(value || searchText);
            onItemSelect?.(value || searchText);
          }
        }}
        className={cn(
          "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          isSelected && "bg-slate-100 text-slate-900",
          disabled && "pointer-events-none opacity-50",
          "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CommandItem.displayName = "CommandItem";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};

export type { CommandProps, CommandGroupProps, CommandItemProps };
