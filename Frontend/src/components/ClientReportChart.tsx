// src/components/ClientReportChart.tsx

import React from 'react';
import { 
    ComposedChart, 
    BarChart, 
    LineChart, 
    Bar, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    ResponsiveContainer // Import ResponsiveContainer here
} from 'recharts';

interface ReportDetail {
  type: string;
  chartData: any[];
}

const ClientReportChart = ({ report }: { report: ReportDetail }) => {
  if (!report || !report.chartData || report.chartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-400">No chart data available for this report.</div>;
  }

  // The ResponsiveContainer now wraps the chart directly
  return (
    <ResponsiveContainer width="100%" height="100%">
      {(() => {
        switch (report.type) {
          case 'hourly-activity':
            return (
              <ComposedChart data={report.chartData}> 
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="hour" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Bar dataKey="Entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exits" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Predictor" stroke="#22c55e" />
              </ComposedChart>
            );
          case 'entries-over-time':
            return (
              <LineChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="period" stroke="#888888" fontSize={12} tick={{ angle: -20, textAnchor: 'end' }} height={60} />
                <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Line type="monotone" dataKey="Entries" stroke="#22c55e" dot={false} connectNulls />
                <Line type="monotone" dataKey="Predictor" stroke="#a78bfa" strokeDasharray="5 5" dot={false} connectNulls />
              </LineChart>
            );
          case 'overstay-analysis':
            return (
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Bar dataKey="Overstaying Vehicles" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            );
          default:
            return <p className="text-center text-yellow-400">Unknown report type.</p>;
        }
      })()}
    </ResponsiveContainer>
  );
};

export default ClientReportChart;