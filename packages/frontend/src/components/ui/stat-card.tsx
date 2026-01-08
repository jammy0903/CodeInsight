import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'info';
  icon?: React.ReactNode;
  percent?: number;
}

const variantStyles = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  info: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500',
};

export function StatCard({ title, value, variant, icon, percent }: StatCardProps) {
  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-80 mb-1">{title}</p>
            <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {icon && <span className="opacity-80">{icon}</span>}
            {percent !== undefined && (
              <span className="text-xs font-medium">{percent}%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
