// src/components/HalfDonutGauge.jsx
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function HalfDonutGauge({ data, colors, totalSpent, totalBudget }) {
  return (
    <div className="relative mx-auto h-56 w-full max-w-xs">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="85%"
            startAngle={180}
            endAngle={0}
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center">
        <div className="text-sm text-fgMuted">Spent</div>
        <div className="text-3xl font-semibold text-fg">{formatCurrency(totalSpent)}</div>
        <div className="text-xs text-fgSubtle">of {formatCurrency(totalBudget)} budget</div>
      </div>
    </div>
  );
}
