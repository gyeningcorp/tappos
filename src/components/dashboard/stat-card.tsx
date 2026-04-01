import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number | null;
  changeLabel?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = "vs yesterday",
}: StatCardProps) {
  const isPositive = change !== null && change !== undefined && change > 0;
  const isNegative = change !== null && change !== undefined && change < 0;
  const isNeutral = change === null || change === undefined || change === 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {change !== null && change !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {isPositive && (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            )}
            {isNegative && (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            {isNeutral && <Minus className="h-4 w-4 text-muted-foreground" />}
            <span
              className={cn(
                "font-medium",
                isPositive && "text-emerald-500",
                isNegative && "text-red-500",
                isNeutral && "text-muted-foreground"
              )}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
