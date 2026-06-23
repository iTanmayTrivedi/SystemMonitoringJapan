import { Sun, Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { t } = useI18n();
  return (
    <button
      onClick={onToggle}
      className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
      title={theme === "dark" ? t("theme.light") : t("theme.dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
