import { Search, Filter, Server, Database, Cog, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: string;
  onLevelFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
}

const levels = [
  { value: "all", label: "All Levels" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

const sources = [
  { value: "all", label: "All Sources", icon: null },
  { value: "api-server", label: "API Server", icon: Server },
  { value: "database", label: "Database", icon: Database },
  { value: "worker", label: "Worker", icon: Cog },
  { value: "auth-service", label: "Auth Service", icon: ShieldCheck },
];

const levelActiveStyles: Record<string, string> = {
  all: "bg-accent text-foreground",
  info: "bg-primary/15 text-primary border-primary/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};

export function LogFilters({ search, onSearchChange, levelFilter, onLevelFilterChange, sourceFilter, onSourceFilterChange }: LogFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-secondary border-border font-mono text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-lg border border-border">
          <Filter className="h-4 w-4 text-muted-foreground ml-2" />
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => onLevelFilterChange(level.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all border border-transparent ${
                levelFilter === level.value
                  ? levelActiveStyles[level.value]
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-lg border border-border w-fit">
        {sources.map((src) => {
          const Icon = src.icon;
          return (
            <button
              key={src.value}
              onClick={() => onSourceFilterChange(src.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all border border-transparent ${
                sourceFilter === src.value
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {src.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
