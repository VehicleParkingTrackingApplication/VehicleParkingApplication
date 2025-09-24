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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                <XAxis dataKey="hour" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                <Legend />
                <Bar dataKey="Entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exits" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Predictor" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            );
          case 'entries-over-time':
            return (
              <LineChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                <XAxis dataKey="period" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} tick={{ angle: -20, textAnchor: 'end' }} height={60} />
                <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                <Legend />
                <Line type="monotone" dataKey="Entries" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Predictor" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
              </LineChart>
            );
          case 'overstay-analysis':
            return (
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                <XAxis dataKey="date" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                <Legend />
                <Bar dataKey="Overstaying Vehicles" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            );
          default:
            return <p className="text-center text-gray-600">Unknown report type.</p>;
        }
      })()}
    </ResponsiveContainer>
  );
};

export default ClientReportChart;