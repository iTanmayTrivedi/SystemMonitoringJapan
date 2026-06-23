import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  Sun,
  Moon,
  Bell,
  Settings2,
  Brain,
  Download,
  Keyboard,
} from "lucide-react";

interface CommandPaletteProps {
  onToggleTheme: () => void;
  onToggleAlerts: () => void;
  onToggleRules: () => void;
  theme: "dark" | "light";
}

export function CommandPalette({ onToggleTheme, onToggleAlerts, onToggleRules, theme }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = useCallback((fn: () => void) => {
    fn();
    setOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-3 rounded-lg border border-border bg-secondary flex items-center gap-2 hover:bg-accent transition-colors"
        title={t("cmd.title")}
      >
        <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">⌘K</span>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("cmd.placeholder")} className="font-mono" />
        <CommandList>
          <CommandEmpty className="font-mono text-sm text-muted-foreground py-6 text-center">
            No results found.
          </CommandEmpty>
          <CommandGroup heading={t("cmd.navigation")} className="font-mono">
            <CommandItem onSelect={() => run(() => navigate("/"))} className="font-mono text-sm">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t("cmd.dashboard")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate("/incidents"))} className="font-mono text-sm">
              <FileText className="mr-2 h-4 w-4" />
              {t("cmd.incidents")}
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={t("cmd.actions")} className="font-mono">
            <CommandItem onSelect={() => run(onToggleTheme)} className="font-mono text-sm">
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {t("cmd.toggleTheme")}
            </CommandItem>
            <CommandItem onSelect={() => run(onToggleAlerts)} className="font-mono text-sm">
              <Bell className="mr-2 h-4 w-4" />
              {t("cmd.toggleAlerts")}
            </CommandItem>
            <CommandItem onSelect={() => run(onToggleRules)} className="font-mono text-sm">
              <Settings2 className="mr-2 h-4 w-4" />
              {t("cmd.toggleRules")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
