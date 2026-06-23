import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ja" : "en")}
      className="h-9 px-2.5 rounded-lg border border-border bg-secondary flex items-center gap-1.5 hover:bg-accent transition-colors"
      title={lang === "en" ? "日本語に切り替え" : "Switch to English"}
    >
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-mono font-bold text-muted-foreground">{lang === "en" ? "EN" : "JA"}</span>
    </button>
  );
}
