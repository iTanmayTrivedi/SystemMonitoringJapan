import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "glow-green border-primary/20",
  success: "glow-green border-primary/20",
  warning: "glow-amber border-warning/20",
  danger: "glow-red border-destructive/20",
};

const iconVariantStyles = {
  default: "text-primary",
  success: "text-primary",
  warning: "text-warning",
  danger: "text-destructive",
};

export function StatusCard({ title, value, icon: Icon, trend, variant = "default" }: StatusCardProps) {
  return (
    <div className={`rounded-lg border bg-card p-5 transition-all duration-300 hover:scale-[1.02] ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${iconVariantStyles[variant]}`} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-foreground">{value}</span>
        {trend && (
          <span className="text-xs font-mono text-muted-foreground mb-1">{trend}</span>
        )}
      </div>
    </div>
  );
}
