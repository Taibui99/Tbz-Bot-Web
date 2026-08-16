'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Props = {
  data: { label: string; count: number }[]
  total: number
}

export default function TrafficChart({ data, total }: Props) {
  return (
    <div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b7cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b7cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(13,16,25,0.95)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 12,
                fontSize: 12,
                color: '#fff',
                boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: 'var(--text-3)', marginBottom: 4 }}
              formatter={(value) => [`${value} tin`, 'Tin nhắn']}
            />
            <Area type="monotone" dataKey="count" stroke="#8b7cf6" strokeWidth={2.5} fill="url(#trafficFill)" activeDot={{ r: 4 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--text-3)' }}>7 ngày gần nhất</span>
        <span>
          <b>{total}</b> <span style={{ color: 'var(--text-3)' }}>tin tổng</span>
        </span>
      </div>
    </div>
  )
}