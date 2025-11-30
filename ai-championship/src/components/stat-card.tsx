import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  children?: React.ReactNode;
};

export function StatCard({ title, value, icon: Icon, description, trend, children }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{value}</div>
            {trend && trend !== 'stable' && (
                <div className={cn(
                    "flex items-center text-xs font-semibold",
                    trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                )}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    <span>{trend === 'up' ? 'Up' : 'Down'}</span>
                </div>
            )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
