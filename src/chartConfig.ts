import type { Chart, TooltipItem } from "chart.js";
import type { WeightData } from "./api";

const calculateYAxisRange = (chartData: WeightData[]) => {
  if (chartData.length === 0) {
    return { min: undefined, max: undefined };
  }

  const weights = chartData.map((item) => item.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight;
  const padding = Math.max(0.5, range * 0.1);

  return {
    min: Math.floor(minWeight - padding),
    max: Math.ceil(maxWeight + padding),
  };
};

export const chartOptions = (
  chartData: WeightData[],
  viewStartDate: number,
  viewEndDate: number,
  setViewStartDate: (date: number) => void,
  setViewEndDate: (date: number) => void,
  minDate: string,
  maxDate: string
) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
          displayFormats: {
            day: "dd.MM.yy",
          },
          tooltipFormat: "dd.MM.yy",
          stepSize: 1, // One tick per day
        },
        title: {
          display: false,
        },
        min: viewStartDate || undefined,
        max: viewEndDate || undefined,
        ticks: {
          source: "auto",
          autoSkip: false,
          font: {
            size: 10,
          },
        },
      },
      y: {
        title: {
          display: false,
        },
        min: calculateYAxisRange(chartData).min,
        max: calculateYAxisRange(chartData).max,
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          threshold: 10,
          onPan: ({ chart }: { chart: Chart }) => {
            const xScale = chart.scales.x;
            setViewStartDate(xScale.min);
            setViewEndDate(xScale.max);
          },
        },
        limits: {
          x: {
            minRange: 26 * 24 * 60 * 60 * 1000,
            maxRange: 26 * 24 * 60 * 60 * 1000,
            min: new Date(minDate).getTime(),
            max: new Date(maxDate).getTime() + 24 * 60 * 60 * 1000,
          },
        },
        zoom: {
          wheel: {
            enabled: false, // Disable wheel zoom
          },
          pinch: {
            enabled: false, // Disable pinch zoom
          },
          mode: "x",
        },
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<"line">[]) => {
            const timestamp = context[0].parsed.x;
            return new Date(timestamp).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
          },
        },
      },
    },
  };
};
