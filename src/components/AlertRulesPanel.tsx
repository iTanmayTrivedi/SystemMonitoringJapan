import { useState } from "react";
import { AlertRule } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings2, Plus, Trash2, X } from "lucide-react";

interface AlertRulesPanelProps {
  rules: AlertRule[];
  isAdmin: boolean;
  onAdd: (rule: Omit<AlertRule, "id" | "created_by" | "created_at" | "updated_at">) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AlertRule>) => void;
}

const METRICS = ["cpu", "memory", "disk"];
const SEVERITIES: Array<"warning" | "error" | "critical"> = ["warning", "error", "critical"];

const sevColors: Record<string, string> = {
  warning: "text-warning border-warning/20 bg-warning/10",
  error: "text-destructive border-destructive/20 bg-destructive/10",
  critical: "text-destructive border-destructive/20 bg-destructive/10",
};

export function AlertRulesPanel({ rules, isAdmin, onAdd, onToggle, onDelete, onUpdate }: AlertRulesPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    metric: "cpu",
    source: "system-monitor",
    threshold: 80,
    duration_seconds: 0,
    severity: "warning" as "warning" | "error" | "critical",
    message_template: "CPU usage high at {value}% (threshold: {threshold}%)",
    cooldown_seconds: 30,
    enabled: true,
  });

  const handleAdd = () => {
    onAdd(newRule);
    setShowAdd(false);
    setNewRule({
      metric: "cpu",
      source: "system-monitor",
      threshold: 80,
      duration_seconds: 0,
      severity: "warning",
      message_template: "CPU usage high at {value}% (threshold: {threshold}%)",
      cooldown_seconds: 30,
      enabled: true,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="font-mono font-semibold text-sm text-foreground">Alert Rules</h3>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
            {rules.filter((r) => r.enabled).length} active
          </span>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)} className="font-mono text-xs h-7">
            {showAdd ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            {showAdd ? "Cancel" : "Add Rule"}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && isAdmin && (
        <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Metric</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono focus:ring-1 focus:ring-ring"
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Threshold (%)</label>
              <Input
                type="number"
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                className="h-8 text-xs font-mono"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Severity</label>
              <select
                value={newRule.severity}
                onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono focus:ring-1 focus:ring-ring"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Cooldown (sec)</label>
              <Input
                type="number"
                value={newRule.cooldown_seconds}
                onChange={(e) => setNewRule({ ...newRule, cooldown_seconds: Number(e.target.value) })}
                className="h-8 text-xs font-mono"
                min={5}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Message Template</label>
            <Input
              value={newRule.message_template}
              onChange={(e) => setNewRule({ ...newRule, message_template: e.target.value })}
              className="h-8 text-xs font-mono"
              placeholder="Use {value} and {threshold} as placeholders"
            />
          </div>
          <Button size="sm" onClick={handleAdd} className="font-mono text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Create Rule
          </Button>
        </div>
      )}

      {/* Rules list */}
      <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto scrollbar-thin">
        {rules.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <span className="font-mono text-sm">No rules configured</span>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`p-3 flex items-center gap-3 hover:bg-accent/30 transition-colors ${!rule.enabled ? "opacity-50" : ""}`}>
              {isAdmin && (
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => onToggle(rule.id, checked)}
                  className="shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-foreground uppercase">{rule.metric}</span>
                  <span className="font-mono text-xs text-muted-foreground">≥ {rule.threshold}%</span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${sevColors[rule.severity]}`}>
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">cooldown: {rule.cooldown_seconds}s</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">{rule.message_template}</p>
              </div>
              {isAdmin && (
                <button onClick={() => onDelete(rule.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
