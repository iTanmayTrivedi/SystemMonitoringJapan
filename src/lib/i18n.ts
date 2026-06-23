import { create } from "zustand";

export type Lang = "en" | "ja";

const translations: Record<string, Record<Lang, string>> = {
  "app.title": { en: "SysMonitor", ja: "SysMonitor" },
  "app.subtitle": { en: "System Dashboard", ja: "システムダッシュボード" },
  "nav.incidents": { en: "Incident Timeline", ja: "インシデント履歴" },
  "nav.alertRules": { en: "Alert Rules", ja: "アラートルール" },
  "nav.signOut": { en: "Sign out", ja: "ログアウト" },
  "status.cpu": { en: "CPU Usage", ja: "CPU使用率" },
  "status.memory": { en: "Memory", ja: "メモリ" },
  "status.disk": { en: "Disk I/O", ja: "ディスクI/O" },
  "status.network": { en: "Network", ja: "ネットワーク" },
  "logs.title": { en: "logs", ja: "ログ" },
  "logs.errors": { en: "errors", ja: "エラー" },
  "logs.warnings": { en: "warnings", ja: "警告" },
  "logs.autoRefresh": { en: "Auto-refreshing", ja: "自動更新中" },
  "btn.generateLogs": { en: "Generate Logs", ja: "ログ生成" },
  "btn.refreshDemo": { en: "Refresh Demo", ja: "デモ更新" },
  "btn.analyze": { en: "Analyze System", ja: "システム分析" },
  "btn.reanalyze": { en: "Re-analyze", ja: "再分析" },
  "ai.title": { en: "AI Insights", ja: "AI分析" },
  "ai.clickToAnalyze": { en: 'Click "Analyze System" for AI-powered insights', ja: '「システム分析」をクリックしてAI分析を開始' },
  "ai.analyzing": { en: "Analyzing logs, metrics & alerts…", ja: "ログ・メトリクス・アラートを分析中…" },
  "ai.summary": { en: "Summary", ja: "サマリー" },
  "ai.logPatterns": { en: "Log Patterns", ja: "ログパターン" },
  "ai.anomalyDetection": { en: "Anomaly Detection", ja: "異常検知" },
  "ai.rootCause": { en: "Root Cause Suggestions", ja: "根本原因の提案" },
  "ai.healthy": { en: "No anomalies detected — system appears healthy", ja: "異常なし — システムは正常です" },
  "anomaly.title": { en: "Anomaly Detection", ja: "異常検知パネル" },
  "anomaly.subtitle": { en: "Real-time pattern analysis & predictive alerts", ja: "リアルタイムパターン分析と予測アラート" },
  "anomaly.score": { en: "Anomaly Score", ja: "異常スコア" },
  "anomaly.predictions": { en: "Predictions", ja: "予測" },
  "anomaly.patterns": { en: "Detected Patterns", ja: "検出パターン" },
  "anomaly.baseline": { en: "Baseline Deviation", ja: "ベースラインからの偏差" },
  "uptime.title": { en: "Uptime & SLA", ja: "稼働率 & SLA" },
  "feed.title": { en: "Live Activity", ja: "ライブアクティビティ" },
  "report.title": { en: "Reports", ja: "レポート" },
  "cmd.title": { en: "Command Palette", ja: "コマンドパレット" },
  "cmd.placeholder": { en: "Type a command or search…", ja: "コマンドまたは検索..." },
  "cmd.navigation": { en: "Navigation", ja: "ナビゲーション" },
  "cmd.actions": { en: "Actions", ja: "アクション" },
  "cmd.dashboard": { en: "Go to Dashboard", ja: "ダッシュボードへ" },
  "cmd.incidents": { en: "Go to Incidents", ja: "インシデントへ" },
  "cmd.toggleTheme": { en: "Toggle Theme", ja: "テーマ切り替え" },
  "cmd.toggleAlerts": { en: "Toggle Alerts", ja: "アラート表示切り替え" },
  "cmd.toggleRules": { en: "Toggle Alert Rules", ja: "ルール表示切り替え" },
  "cmd.runAnalysis": { en: "Run AI Analysis", ja: "AI分析実行" },
  "cmd.exportReport": { en: "Export Report", ja: "レポート出力" },
  "theme.dark": { en: "Dark", ja: "ダーク" },
  "theme.light": { en: "Light", ja: "ライト" },
  "init": { en: "Initializing...", ja: "初期化中..." },
  "access.denied": { en: "Access Denied", ja: "アクセス拒否" },
  "access.required": { en: "Admin or Viewer privileges required", ja: "管理者または閲覧者権限が必要です" },
};

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: (typeof window !== "undefined" ? (localStorage.getItem("sysmonitor-lang") as Lang) : null) || "en",
  setLang: (lang: Lang) => {
    localStorage.setItem("sysmonitor-lang", lang);
    set({ lang });
  },
  t: (key: string) => {
    const { lang } = get();
    return translations[key]?.[lang] || translations[key]?.["en"] || key;
  },
}));
