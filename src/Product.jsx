import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Product({ product }) {
  // Prep the data for the chart
  const chartData = {
    // Extract year from date
    labels: product.map((item) => new Date(item.start_date).getFullYear()),
    datasets: [
      // Add payment price to tooltip
      {
        label: "Payment (Euros)",
        data: product.map((item) => parseFloat(item.payment)),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: false,
      },
      // Add benchmark price to tooltip
      {
        label: "Benchmark (Euros)",
        data: product.map((item) => parseFloat(item.benchmark)),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Payment vs Benchmark for ${product[0].product_name}`,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const datasetLabel = tooltipItem.dataset.label || "";
            const dataPoint = tooltipItem.raw.toFixed(2);

            const payment = parseFloat(product[tooltipItem.dataIndex].payment);
            const benchmark = parseFloat(product[tooltipItem.dataIndex].benchmark);

            let comparison = "";
            if (tooltipItem.datasetIndex === 0) {
              const difference = (payment - benchmark).toFixed(2);
              comparison =
                difference > 0
                  ? `${difference} more than benchmark`
                  : `${Math.abs(difference)} less than benchmark`;
            } else {
              const difference = (benchmark - payment).toFixed(2);
              comparison =
                difference > 0
                  ? `${difference} more than payment`
                  : `${Math.abs(difference)} less than payment`;
            }
            // Difference of Benchmark/Payment amount
            return [`${datasetLabel}: ${dataPoint}`, `${comparison}`];
          },
        },
      },
    },
  };

  return (
    <>
      {product && product.length > 0 && (
        <div className="product-chart">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </>
  );
}
