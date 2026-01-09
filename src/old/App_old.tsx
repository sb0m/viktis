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
  type Chart,
  type TooltipItem,
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import { saveAs } from "file-saver";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  VscAdd,
  VscArrowRight,
  VscClose,
  VscSave,
  VscShare,
} from "react-icons/vsc";
import { fetchWeightData } from "../api";

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

interface DataResponse {
  weights: WeightData[];
}

function App() {
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [filteredData, setFilteredData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");

  const [newDate, setNewDate] = useState<string>(
    formatDateForInput(new Date())
  );
  const [newWeight, setNewWeight] = useState<string>("");
  const [addingData, setAddingData] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [viewStartDate, setViewStartDate] = useState<number>(0);
  const [viewEndDate, setViewEndDate] = useState<number>(0);

  const localDataLoaded = useRef(false);
  const chartRef = useRef(null);

  const LOCAL_STORAGE_KEY = "viktis_user_data";

  const initializeViewWindow = (data: WeightData[], endTimestamp: number) => {
    console.log("Initializing view window data:", data);
    setViewEndDate(endTimestamp);

    const startTimestamp = endTimestamp - 25 * 24 * 60 * 60 * 1000;
    setViewStartDate(startTimestamp);
  };

  const mergeWeightData = (
    baseData: WeightData[],
    userData: WeightData[]
  ): WeightData[] => {
    const dataMap = new Map<number, WeightData>();

    baseData.forEach((item) => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      dataMap.set(date.getTime(), { ...item, date: date.getTime() });
    });
    userData.forEach((item) => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      dataMap.set(date.getTime(), { ...item, date: date.getTime() });
    });

    return Array.from(dataMap.values());
  };

  const saveUserData = (userData: WeightData[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
      console.log("Saved user data to local storage:", userData);
    } catch (err) {
      console.error("Error saving user data to local storage:", err);
      setAddError(
        "Failed to save data to local storage. Your browser might have storage restrictions."
      );
    }
  };

  const loadApiData = async () => {
    const weightData = await fetchWeightData();
    console.log("APICOOOOS:", weightData);

    // Now you can use the data
    // loadAndMergeUserData(apiData);
    // setLoading(false);
  };

  useEffect(() => {
    loadApiData();
    const loadAndMergeUserData = (baseData: WeightData[]) => {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        let userData: WeightData[] = [];

        if (storedData) {
          userData = JSON.parse(storedData);
          console.log("Loaded user data from local storage:", userData);
        }

        const mergedData = mergeWeightData(baseData, userData);

        const sortedData = mergedData.sort((a, b) => a.date - b.date);

        setWeightData(sortedData);
        setFilteredData(sortedData);

        if (sortedData.length > 0) {
          const firstDate = new Date(sortedData[0].date);
          const lastDataDate = new Date(sortedData[sortedData.length - 1].date);
          const today = new Date();
          today.setHours(12, 0, 0, 0);
          const lastDate = today > lastDataDate ? today : lastDataDate;

          const firstDateStr = formatDateForInput(firstDate);
          const lastDateStr = formatDateForInput(lastDate);

          setMinDate(firstDateStr);
          setMaxDate(lastDateStr);

          initializeViewWindow(sortedData, lastDate.getTime());
        }

        localDataLoaded.current = true;
      } catch (err) {
        console.error("Error loading user data from local storage:", err);
        const sortedData = [...baseData].sort((a, b) => a.date - b.date);
        setWeightData(sortedData);
        setFilteredData(sortedData);

        if (sortedData.length > 0) {
          const firstDate = new Date(sortedData[0].date);
          const lastDate = new Date(sortedData[sortedData.length - 1].date);

          setMinDate(formatDateForInput(firstDate));
          setMaxDate(formatDateForInput(lastDate));
        }
      }
    };

    const baseUrl = import.meta.env.BASE_URL || "/viktis/";

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

        const baseData = [...data.weights];
        loadAndMergeUserData(baseData);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(`Failed to load weight data: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const exportData = () => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (!storedData) {
        alert("No data found in local storage.");
        return;
      }

      // Parse the stored data - this will be an array of WeightData objects
      const userData: WeightData[] = JSON.parse(storedData);

      // Format it to match the structure in public/data.json
      const exportData = {
        settings: [{ key: "goal" }],
        version: 0,
        weights: userData,
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create a blob and download it
      const blob = new Blob([jsonString], { type: "application/json" });
      saveAs(blob, "weight_data_export.json");

      console.log("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. See console for details.");
    }
  };

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

      const newDataPoint: WeightData = {
        date: dateValue.getTime(),
        weight: weightValue,
      };

      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const userData: WeightData[] = storedData ? JSON.parse(storedData) : [];

      const existingIndex = userData.findIndex((item) => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === dateValue.toDateString();
      });

      if (existingIndex >= 0) {
        userData[existingIndex] = newDataPoint;
      } else {
        userData.push(newDataPoint);
      }

      saveUserData(userData);

      const mergedData = mergeWeightData(weightData, userData);
      const sortedData = mergedData.sort((a, b) => a.date - b.date);

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

      setFilteredData(sortedData);

      setNewWeight("");
      setAddingData(false);
    } catch (err) {
      console.error("Error adding data point:", err);
      setAddError("Failed to add data point. Please try again.");
    }
  };

  const createTimeScaleDataset = () => {
    if (filteredData.length === 0) return null;

    return {
      datasets: [
        {
          label: "Weight (kg)",
          data: filteredData.map((item) => ({
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

  const chartData = createTimeScaleDataset();

  const calculateYAxisRange = () => {
    if (filteredData.length === 0) {
      return { min: undefined, max: undefined };
    }

    const weights = filteredData.map((item) => item.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight;
    const padding = Math.max(0.5, range * 0.1);

    return {
      min: Math.floor(minWeight - padding),
      max: Math.ceil(maxWeight + padding),
    };
  };

  // Add this function to your App component
  const scrollToLatestDate = () => {
    if (weightData.length === 0) return;

    // Find the latest date in the data
    const latestDate = new Date(
      Math.max(...weightData.map((item) => item.date))
    );

    // Set the view window to show the latest 26 days (matching your current window size)
    const endDate = latestDate.getTime();
    const startDate = endDate - 25 * 24 * 60 * 60 * 1000;

    setViewEndDate(endDate);
    setViewStartDate(startDate);

    // If you have a chart reference, you can also update the chart directly
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

  const yAxisRange = calculateYAxisRange();

  const chartOptions = {
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
        min: yAxisRange.min,
        max: yAxisRange.max,
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
            return new Date(timestamp ?? 0).toLocaleDateString(undefined, {
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
        <div
          className="add-data"
          style={!addingData ? { alignItems: "flex-start" } : {}}
        >
          {addingData ? (
            <div className="form">
              <div className="inputs">
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
                  placeholder="New weight / kg"
                />
                <button className="btn" onClick={addOrUpdateDataPoint}>
                  <VscSave />
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setAddingData(false);
                    setAddError(null);
                    setNewWeight("");
                  }}
                >
                  <VscClose />
                </button>
              </div>
              {addError && <div className="error">{addError}</div>}
            </div>
          ) : (
            <div className="inputs">
              <button
                className="btn"
                onClick={() => {
                  setNewDate(formatDateForInput(new Date()));
                  setAddingData(true);
                }}
              >
                <VscAdd />
              </button>
              <button
                onClick={scrollToLatestDate}
                className="btn"
                title="Scroll to latest data"
              >
                <VscArrowRight /> {/* Or use another appropriate icon */}
              </button>
            </div>
          )}
        </div>
        {!addingData && (
          <button onClick={exportData} className="btn">
            <VscShare />
          </button>
        )}
      </div>
      <div className="chart-container">
        {filteredData.length === 0 ? (
          <div className="message">
            No data available for the selected date range.
          </div>
        ) : (
          <div className="chart-wrapper">
            {chartData && (
              // @ts-expect-error huhu
              <Line data={chartData} options={chartOptions} ref={chartRef} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
