"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

/** WIMUS-Markenpalette (Design System; ergänzt Shadcn-Graustufen). */
export const WIMUS_FARBEN = [
  "#1F4E5F", // primary
  "#2E75B6", // secondary
  "#0D7680", // teal
  "#2E7D32", // success
  "#F59E0B", // warning
  "#C62828", // danger
]

function eur(v: number): string {
  return v.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
}

type Datum = Record<string, string | number>

/** Balkendiagramm (eine oder mehrere Wert-Serien) im WIMUS-Stil. */
export function BalkenChart({
  data,
  kategorie,
  serien,
  hoehe = 280,
  alsEuro = true,
}: {
  data: Datum[]
  kategorie: string
  serien: { key: string; label: string }[]
  hoehe?: number
  alsEuro?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={hoehe}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={kategorie} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="var(--muted-foreground)"
          tickFormatter={alsEuro ? (v) => eur(Number(v)) : undefined}
          width={alsEuro ? 72 : 40}
        />
        <Tooltip
          formatter={alsEuro ? (v) => eur(Number(v)) : undefined}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 12,
          }}
        />
        {serien.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {serien.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={WIMUS_FARBEN[i % WIMUS_FARBEN.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Donut-Diagramm (Anteile) im WIMUS-Stil. */
export function DonutChart({
  data,
  nameKey,
  wertKey,
  hoehe = 280,
  alsEuro = true,
}: {
  data: Datum[]
  nameKey: string
  wertKey: string
  hoehe?: number
  alsEuro?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={hoehe}>
      <PieChart>
        <Pie
          data={data}
          dataKey={wertKey}
          nameKey={nameKey}
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={WIMUS_FARBEN[i % WIMUS_FARBEN.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={alsEuro ? (v) => eur(Number(v)) : undefined}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
