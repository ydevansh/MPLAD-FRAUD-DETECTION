import type { RiskLevel } from '../types';
import { RISK_COLORS, RISK_BG } from '../utils/riskHelpers';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showDonut?: boolean;
}

export default function RiskScoreBadge({ score, level, size = 'md', showDonut = false }: Props) {
  const color = RISK_COLORS[level];
  const bg = RISK_BG[level];
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  if (showDonut) {
    const data = [{ value: score }, { value: 100 - score }];
    return (
      <div className={`flex flex-col items-center gap-2 risk-donut-${level}`}>
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={64} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                <Cell fill={color} />
                <Cell fill="rgba(255,255,255,0.05)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
            <span className="text-gray-500 text-xs">/100</span>
          </div>
        </div>
        <span className={`border text-xs font-semibold px-3 py-1 rounded-full ${bg}`}>{label}</span>
      </div>
    );
  }

  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' };
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-semibold ${bg} ${sizes[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {score} · {label}
    </span>
  );
}
