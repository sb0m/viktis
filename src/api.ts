/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export interface ApicoResponse {
  values: any;
  data: {
    records: Array<{
      Date: string;
      Weight: number;
    }>;
  };
}

export interface WeightData {
  date: number;
  weight: number;
}

const APICO_BASE_URL = "https://api.apico.dev/v1/O26sb8";
const SHEET_ID = "1YtPNls1h0TxhQPUMdmMHIoKOoDZI7mB5-BsLeXVyQsM";
const SHEET_NAME = "erik";
const API_ENDPOINT = `${APICO_BASE_URL}/${SHEET_ID}/values/${SHEET_NAME}`;

export async function fetchWeightData(): Promise<WeightData[]> {
  try {
    const response = await axios.get<ApicoResponse>(API_ENDPOINT);

    const weightData: WeightData[] = response.data.values
      .slice(1)
      .map((row: string[]) => {
        const dateObj = new Date(row[0]);
        dateObj.setHours(12, 0, 0, 0);

        return {
          date: dateObj.getTime(),
          weight: parseFloat(row[1]),
        };
      });
    console.log("API Response weightData:", weightData);
    return weightData;
  } catch (error) {
    console.error("Error fetching weight data from API:", error);
    throw error;
  }
}
