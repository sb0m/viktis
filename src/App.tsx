/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { VscArrowRight, VscSave } from "react-icons/vsc";
import { fetchWeightData } from "./api";
import { chartOptions } from "./chartConfig";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

interface WeightData {
  date: number;
  weight: number;
}

function App() {
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [chartData, setChartData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [newDate, setNewDate] = useState<string>(
    formatDateForInput(new Date())
  );
  const [newWeight, setNewWeight] = useState<string>("");
  const [addError, setAddError] = useState<string | null>(null);
  const [viewStartDate, setViewStartDate] = useState<number>(0);
  const [viewEndDate, setViewEndDate] = useState<number>(0);

  const chartRef = useRef(null);

  const initializeViewWindow = (endTimestamp: number) => {
    setViewEndDate(endTimestamp);

    const startTimestamp = endTimestamp - 25 * 24 * 60 * 60 * 1000;
    setViewStartDate(startTimestamp);
  };

  // const saveUserData = (userData: WeightData[]) => {
  //   // save in google sheet
  //   console.log("Saving user data:", userData);
  // };

  // const deleteUserData = (userData: WeightData) => {
  //   // save in google sheet
  //   console.log("Delete user data:", userData);
  // };

  useEffect(() => {
    const loadData = async () => {
      try {
        fetchWeightData().then((responseData: WeightData[]) => {
          const sortedData = responseData.sort((a, b) => a.date - b.date);

          setWeightData(sortedData);
          setChartData(sortedData);

          if (sortedData.length > 0) {
            const firstDate = new Date(sortedData[0].date);
            const lastDataDate = new Date(
              sortedData[sortedData.length - 1].date
            );
            const today = new Date();
            today.setHours(12, 0, 0, 0);
            const lastDate = today > lastDataDate ? today : lastDataDate;

            const firstDateStr = formatDateForInput(firstDate);
            const lastDateStr = formatDateForInput(lastDate);

            setMinDate(firstDateStr);
            setMaxDate(lastDateStr);

            initializeViewWindow(lastDate.getTime());
          }
          setLoading(false);
        });
      } catch (err) {
        setError(
          (err as { message: string })?.message || "Failed to load weight data"
        );
      }
    };

    loadData();
  }, []);

  const addOrUpdateDataPoint = () => {
    setAddError(null);

    if (!newDate || !newWeight) {
      setAddError("Please enter both date and weight");
      return;
    }

    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 500) {
      setAddError("Please enter a valid weight (between 0 and 500 kg)");
      return;
    }

    try {
      const dateValue = new Date(newDate);
      dateValue.setHours(12, 0, 0, 0);

      // const newDataPoint: WeightData = {
      //   date: dateValue.getTime(),
      //   weight: weightValue,
      // };

      const sortedData = weightData.sort((a, b) => a.date - b.date);

      setWeightData(sortedData);

      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const todayStr = formatDateForInput(today);

      if (sortedData.length > 0) {
        const firstDate = new Date(sortedData[0].date);

        const lastDataDate = new Date(sortedData[sortedData.length - 1].date);
        const lastDate = today > lastDataDate ? today : lastDataDate;

        const firstDateStr = formatDateForInput(firstDate);
        const lastDateStr = formatDateForInput(lastDate);

        setMinDate(firstDateStr);
        setMaxDate(lastDateStr);
      } else {
        setMinDate(todayStr);
        setMaxDate(todayStr);
      }

      setChartData(sortedData);
      setNewWeight("");
    } catch (err) {
      console.error("Error adding data point:", err);
      setAddError("Failed to add data point. Please try again.");
    }
  };

  const createChartDataset = () => {
    if (chartData.length === 0)
      return {
        datasets: [],
      };

    return {
      datasets: [
        {
          label: "Weight (kg)",
          data: chartData.map((item) => ({
            x: item.date,
            y: item.weight,
          })),
          fill: false,
          borderColor: "#AAD2BA",
          backgroundColor: "#6B8F71",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const chartDataSet = createChartDataset();

  const scrollToLatestDate = () => {
    if (weightData.length === 0) return;

    const latestDate = new Date(
      Math.max(...weightData.map((item) => item.date))
    );

    const endDate = latestDate.getTime();
    const startDate = endDate - 25 * 24 * 60 * 60 * 1000;

    setViewEndDate(endDate);
    setViewStartDate(startDate);

    if (chartRef.current) {
      const chart = chartRef.current;
      // @ts-expect-error huhu
      chart.scales.x.min = startDate;
      // @ts-expect-error huhu
      chart.scales.x.max = endDate;
      // @ts-expect-error huhu
      chart.update();
    }
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
      <div className="settings">
        <div className="form">
          <input
            className="input-field"
            type="date"
            id="new-date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            max={formatDateForInput(new Date())}
          />
          <input
            className="input-field"
            type="number"
            id="new-weight"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            step="0.1"
            min="0"
            max="500"
            placeholder="weight / kg"
            autoFocus
          />
          <button
            className="btn"
            onClick={addOrUpdateDataPoint}
            disabled={!newWeight}
          >
            <VscSave />
          </button>
          <button
            onClick={scrollToLatestDate}
            className="btn"
            title="Scroll to latest data"
          >
            <VscArrowRight /> {/* Or use another appropriate icon */}
          </button>
        </div>
        {addError && <div className="error">{addError}</div>}
      </div>
      <div className="chart-container">
        {chartData.length === 0 ? (
          <div className="message">
            No data available for the selected date range.
          </div>
        ) : (
          <div className="chart-wrapper">
            {chartData && (
              <Line
                data={chartDataSet}
                options={
                  chartOptions(
                    chartData,
                    viewStartDate,
                    viewEndDate,
                    setViewStartDate,
                    setViewEndDate,
                    minDate,
                    maxDate
                  ) as any
                }
                ref={chartRef}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
