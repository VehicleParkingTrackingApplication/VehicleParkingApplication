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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.3)" />
                <XAxis dataKey="hour" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
                <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Bar dataKey="Entries" fill="rgba(255, 255, 255, 0.7)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exits" fill="rgba(255, 255, 255, 0.5)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Predictor" stroke="rgba(255, 255, 255, 0.8)" />
              </ComposedChart>
            );
          case 'entries-over-time':
            return (
              <LineChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.3)" />
                <XAxis dataKey="period" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} tick={{ angle: -20, textAnchor: 'end' }} height={60} />
                <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Line type="monotone" dataKey="Entries" stroke="rgba(255, 255, 255, 0.8)" dot={false} connectNulls />
                <Line type="monotone" dataKey="Predictor" stroke="rgba(255, 255, 255, 0.6)" strokeDasharray="5 5" dot={false} connectNulls />
              </LineChart>
            );
          case 'overstay-analysis':
            return (
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.3)" />
                <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.6)" fontSize={12} />
                <YAxis stroke="rgba(255, 255, 255, 0.6)" fontSize={12} allowDecimals={false} />
                <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                <Legend />
                <Bar dataKey="Overstaying Vehicles" fill="rgba(255, 255, 255, 0.7)" radius={[4, 4, 0, 0]} />
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