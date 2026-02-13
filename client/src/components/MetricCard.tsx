import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  /** Short tagline (e.g. "How many people chose you") */
  subtitle?: string;
  /** Context line under the value (e.g. "of 12,400 passersby = 6.8%") */
  context?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function MetricCard({ title, value, subtitle, context, trend, icon, accentColor = '#78BE20' }: MetricCardProps) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: accentColor }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && <div style={{ color: accentColor }}>{icon}</div>}
      </CardHeader>
      <CardContent>
        {subtitle && (
          <p className="text-xs text-gray-500 mb-1">{subtitle}</p>
        )}
        <div className="text-2xl font-bold" style={{ color: accentColor }}>{value}</div>
        {context && (
          <p className="text-sm text-gray-600 mt-1">{context}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

