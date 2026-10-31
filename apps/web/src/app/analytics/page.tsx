'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const movementData = [
    { name: 'Mon', Receipts: 45, Sales: 38, Adjustments: 4 },
    { name: 'Tue', Receipts: 20, Sales: 52, Adjustments: 2 },
    { name: 'Wed', Receipts: 60, Sales: 44, Adjustments: 5 },
    { name: 'Thu', Receipts: 15, Sales: 65, Adjustments: 1 },
    { name: 'Fri', Receipts: 80, Sales: 95, Adjustments: 6 },
    { name: 'Sat', Receipts: 110, Sales: 140, Adjustments: 8 },
    { name: 'Sun', Receipts: 90, Sales: 125, Adjustments: 3 },
  ];

  const categoryValueData = [
    { name: 'Botanicals', value: 8400, color: '#8A2BE2' },
    { name: 'Creature Parts', value: 12500, color: '#FF7518' },
    { name: 'Minerals', value: 6200, color: '#00E676' },
    { name: 'Essences', value: 9800, color: '#9933FF' },
    { name: 'Solvents', value: 3100, color: '#FF4081' },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Category,Value,Proportion\n' +
      categoryValueData.map((e) => `${e.name},${e.value},${((e.value / 40000) * 100).toFixed(1)}%`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `potionpulse-analytics-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-potionPurple" />
              Executive Analytics & Performance Intelligence
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Cross-category profitability, inventory turnover ratios, and transaction velocity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-midnight rounded-lg p-0.5 border border-potionPurple/20 text-xs font-semibold">
              {(['7d', '30d', '90d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    timeframe === t ? 'bg-potionPurple text-white' : 'text-paleLavender/60 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-potionPurple hover:bg-potionPurple/90 text-white"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cauldronGreen/20 border border-cauldronGreen/30 flex items-center justify-center text-cauldronGreen">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Gross Margin</p>
              <p className="text-2xl font-bold text-white">68.4%</p>
              <span className="text-[10px] text-cauldronGreen font-mono">+4.2% vs prior month</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-potionPurple/20 border border-potionPurple/30 flex items-center justify-center text-potionPurple">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Turnover Velocity</p>
              <p className="text-2xl font-bold text-white">4.8x / yr</p>
              <span className="text-[10px] text-paleLavender/60 font-mono">Industry Top Quartile</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pumpkin/20 border border-pumpkin/30 flex items-center justify-center text-pumpkin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Total Dispensed</p>
              <p className="text-2xl font-bold text-white">1,480 units</p>
              <span className="text-[10px] text-pumpkin font-mono">During Midnight Surge</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-paleLavender/60">Stockout Frequency</p>
              <p className="text-2xl font-bold text-crimson">1.2%</p>
              <span className="text-[10px] text-cauldronGreen font-mono">&darr; 85% with PotionPulse</span>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Movement Flow Chart */}
          <Card className="lg:col-span-8 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Weekly Stock Movement Volume</h3>
              <p className="text-xs text-paleLavender/60">
                Receipts (incoming replenishment), Sales deductions, and manual reconciliation adjustments.
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D124D" />
                  <XAxis dataKey="name" stroke="#D1C4E9" opacity={0.6} fontSize={11} />
                  <YAxis stroke="#D1C4E9" opacity={0.6} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D0614',
                      borderColor: '#4A1D7A',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#EDE7F6',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Receipts" fill="#8A2BE2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sales" fill="#FF7518" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Adjustments" fill="#FF4081" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="lg:col-span-4 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Capital Allocation</h3>
              <p className="text-xs text-paleLavender/60">
                Total inventory value breakdown by alchemical classification.
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryValueData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                  >
                    {categoryValueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Value']}
                    contentStyle={{
                      backgroundColor: '#0D0614',
                      borderColor: '#4A1D7A',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 text-xs">
              {categoryValueData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-paleLavender/80">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-mono text-white font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
