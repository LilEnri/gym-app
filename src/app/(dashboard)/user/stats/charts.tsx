"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface StatsChartsProps {
  volumePerSession: Array<{ date: string; volume: number }>;
  topExercises: Array<{ name: string; volume: number }>;
  sessionsPerWeek: Array<{ week: string; count: number }>;
}

const tickStyle = { fill: "rgba(255,255,255,0.5)", fontSize: 11 };
const tooltipStyle = {
  backgroundColor: "rgba(20, 10, 16, 0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  fontSize: 12,
  color: "white",
};

export function StatsCharts({
  volumePerSession,
  topExercises,
  sessionsPerWeek,
}: StatsChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {volumePerSession.length > 0 && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-1">Volume per sessione</h3>
          <p className="text-xs text-white/50 mb-4">Ultime {volumePerSession.length} sessioni (kg totali)</p>
          <div className="h-56 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumePerSession}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "rgba(244,63,94,0.3)" }}
                  formatter={(v: number) => [`${v.toLocaleString("it-IT")} kg`, "Volume"]}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#ff5f5f"
                  strokeWidth={2}
                  dot={{ fill: "#ff2e2e", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {sessionsPerWeek.length > 0 && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-1">Frequenza settimanale</h3>
          <p className="text-xs text-white/50 mb-4">Sessioni per settimana (ultime {sessionsPerWeek.length})</p>
          <div className="h-56 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsPerWeek}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [v, "Sessioni"]}
                />
                <Bar dataKey="count" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {topExercises.length > 0 && (
        <GlassCard className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-1">Top esercizi per volume</h3>
          <p className="text-xs text-white/50 mb-4">Quanto carico totale hai mosso, per esercizio</p>
          <div className="h-56 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topExercises} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={tickStyle}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={tickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [`${v.toLocaleString("it-IT")} kg`, "Volume"]}
                />
                <Bar dataKey="volume" fill="#fb7185" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
