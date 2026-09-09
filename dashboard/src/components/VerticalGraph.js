import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        font: { size: 12 },
        boxWidth: 12,
        padding: 12,
      },
    },
    title: {
      display: true,
      text: "Holdings — Investment vs Current Value",
      font: { size: 14, weight: "500" },
      padding: { bottom: 12 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed.y;
          return ` ${ctx.dataset.label}: ₹${Number(val).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 30,
        font: { size: 11 },
        autoSkip: false,
      },
      grid: { display: false },
    },
    y: {
      ticks: {
        font: { size: 11 },
        callback: (val) =>
          "₹" +
          Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 }),
      },
    },
  },
};

export function VerticalGraph({ data }) {
  /* Min-width based on label count keeps bars readable on any screen */
  const minWidth = Math.max(480, (data?.labels?.length || 1) * 80);

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        marginTop: "28px",
        borderRadius: "8px",
        border: "1px solid #f0f0f0",
        padding: "16px",
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      <div style={{ minWidth: `${minWidth}px`, height: "340px" }}>
        <Bar options={options} data={data} />
      </div>
    </div>
  );
}