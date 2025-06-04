import { useEffect, useState } from "react";
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define the data structure
interface WeightData {
  date: number;
  weight: number;
}

interface DataResponse {
  weights: WeightData[];
  settings: Array<{ key: string }>;
  version: number;
}

function App() {
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the base URL from the import.meta.env
    const baseUrl = import.meta.env.BASE_URL || "/viktis/";

    // Fetch the data from the JSON file with the correct path
    fetch(`${baseUrl}data.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch data: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: DataResponse) => {
        console.log("Data loaded successfully:", data);
        if (!data.weights || !Array.isArray(data.weights)) {
          throw new Error("Invalid data format: weights array not found");
        }
        setWeightData(data.weights);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(`Failed to load weight data: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // Only prepare chart data if we have data
  const chartData =
    weightData.length > 0
      ? {
          labels: weightData.map((item) =>
            new Date(item.date).toLocaleDateString()
          ),
          datasets: [
            {
              label: "Weight (kg)",
              data: weightData.map((item) => item.weight),
              fill: false,
              backgroundColor: "#D87F32", // Using the orange dots color from your config
              borderColor: "#EBCB8B", // Using the line color from your config
              tension: 0.1,
            },
          ],
        }
      : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Weight Tracking Over Time",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxTicksLimit: 10, // Limit the number of ticks to avoid overcrowding
        },
      },
      y: {
        title: {
          display: true,
          text: "Weight (kg)",
        },
        min:
          weightData.length > 0
            ? Math.floor(Math.min(...weightData.map((item) => item.weight)) - 1)
            : undefined,
        max:
          weightData.length > 0
            ? Math.ceil(Math.max(...weightData.map((item) => item.weight)) + 1)
            : undefined,
      },
    },
  };

  if (loading) {
    return <div className="message">Loading weight data...</div>;
  }

  if (error) {
    return (
      <div className="message error">
        <h2>Error</h2>
        <p>{error}</p>
        <p>Please check the console for more details.</p>
      </div>
    );
  }

  if (weightData.length === 0) {
    return <div className="message">No weight data available.</div>;
  }

  return (
    <>
      <h1>viktis</h1>
      <div className="chart-container">
        {chartData && <Line data={chartData} options={chartOptions} />}
      </div>
    </>
  );
}

export default App;
