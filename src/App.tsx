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
}

function App() {
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [filteredData, setFilteredData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");

  useEffect(() => {
    fetch("/viktis/data.json")
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
        const sortedData = [...data.weights].sort((a, b) => a.date - b.date);
        setWeightData(sortedData);
        setFilteredData(sortedData);

        if (sortedData.length > 0) {
          const firstDate = new Date(sortedData[0].date);
          const lastDate = new Date(sortedData[sortedData.length - 1].date);
          const firstDateStr = formatDateForInput(firstDate);
          const lastDateStr = formatDateForInput(lastDate);

          setMinDate(firstDateStr);
          setMaxDate(lastDateStr);

          // Default the date pickers to the first and last dates
          setStartDate(firstDateStr);
          setEndDate(lastDateStr);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(`Failed to load weight data: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // Format date for input element (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateForDisplay = (timestamp: number): string => {
    // Create date in local timezone
    const date = new Date(timestamp);

    // Format consistently using toLocaleDateString with explicit options
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC", // Force UTC interpretation to avoid timezone shifts
    });
  };

  useEffect(() => {
    if (weightData.length === 0) return;

    let filtered = [...weightData];

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      filtered = filtered.filter((item) => item.date >= startTimestamp);
    }

    if (endDate) {
      const endTimestamp =
        new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // End of the selected day
      filtered = filtered.filter((item) => item.date <= endTimestamp);
    }

    setFilteredData(filtered);
  }, [startDate, endDate, weightData]);

  // Handle date range reset
  const resetDateRange = () => {
    // Reset to the first and last dates in the data
    if (weightData.length > 0) {
      const firstDate = new Date(weightData[0].date);
      const lastDate = new Date(weightData[weightData.length - 1].date);

      setStartDate(formatDateForInput(firstDate));
      setEndDate(formatDateForInput(lastDate));
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const createDatasetWithGaps = () => {
    if (filteredData.length === 0) return null;

    // Create an array of all dates and weights
    const dates = filteredData.map((item) => formatDateForDisplay(item.date));
    const weights = filteredData.map((item) => item.weight);

    return {
      labels: dates,
      datasets: [
        {
          label: "Weight (kg)",
          data: weights,
          fill: false,
          backgroundColor: "#D87F32",
          borderColor: "#EBCB8B",
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const chartData = createDatasetWithGaps();

  const chartOptions = {
    responsive: true,
    // plugins: {
    //   // legend: {
    //   //   position: "top" as const,
    //   // },
    //   // title: {
    //   //   display: true,
    //   //   text: "Weight Tracking Over Time",
    //   // },
    // },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          // maxTicksLimit: 10, // Limit the number of ticks to avoid overcrowding
        },
      },
      y: {
        title: {
          display: true,
          text: "Weight (kg)",
        },
        min:
          filteredData.length > 0
            ? Math.floor(
                Math.min(...filteredData.map((item) => item.weight)) - 1
              )
            : undefined,
        max:
          filteredData.length > 0
            ? Math.ceil(
                Math.max(...filteredData.map((item) => item.weight)) + 1
              )
            : undefined,
      },
    },
    spanGaps: true,
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

  console.log(filteredData);

  return (
    <>
      <div className="chart-container">
        <div className="date-inputs">
          <div className="date-input-group">
            <label htmlFor="start-date">From:</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              max={endDate || maxDate}
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="end-date">To:</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || minDate}
              max={maxDate}
            />
          </div>
        </div>
        <button
          className="reset-button"
          onClick={resetDateRange}
          disabled={!startDate && !endDate}
        >
          Reset Range
        </button>
        {filteredData.length === 0 ? (
          <div className="message">
            No data available for the selected date range.
          </div>
        ) : (
          <div className="chart-container">
            {chartData && <Line data={chartData} options={chartOptions} />}
            <div className="data-summary">
              <p>Showing {filteredData.length} data points</p>
              {filteredData.length > 0 && (
                <p>
                  Range: {formatDateForDisplay(filteredData[0].date)} to{" "}
                  {formatDateForDisplay(
                    filteredData[filteredData.length - 1].date
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
