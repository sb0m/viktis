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

const ACCESS_TOKEN =
  "1aa199c4f2bafb5b5129578db327068acaa209bc92c4114d9884c8c2c233486b";
const APICO_BASE_URL = "https://api.apico.dev/v1/O26sb8";
const SHEET_ID = "1YtPNls1h0TxhQPUMdmMHIoKOoDZI7mB5-BsLeXVyQsM";
const SHEET_NAME = "erik";

// https://api.apico.dev/v1/O26sb8/1YtPNls1h0TxhQPUMdmMHIoKOoDZI7mB5-BsLeXVyQsM/values/erik
const API_GET_ENDPOINT = `${APICO_BASE_URL}/${SHEET_ID}/values/${SHEET_NAME}`;
// https://api.apico.dev/v1/O26sb8/{spreadsheetId}/values/{SheetName}:append
const API_POST_ENDPOINT = `${APICO_BASE_URL}/${SHEET_ID}/values/${SHEET_NAME}:append`;
// https://api.apico.dev/v1/O26sb8/{spreadsheetId}/values/{SheetName!range}
const API_PUT_ENDPOINT = `${APICO_BASE_URL}/${SHEET_ID}/values/${SHEET_NAME}!`;

export async function fetchWeightData(): Promise<WeightData[]> {
  try {
    const response = await axios.get<ApicoResponse>(API_GET_ENDPOINT);

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

export async function saveWeightData(
  date: Date,
  weight: number
): Promise<void> {
  try {
    const formattedDate = date.toISOString().split("T")[0];

    const payload = {
      values: [[formattedDate, weight.toString()]],
      majorDimension: "ROWS",
    };

    const response = await axios.post(
      `${API_POST_ENDPOINT}?valueInputOption=USER_ENTERED`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Data saved successfully:", response.data);
  } catch (error) {
    console.error("Error saving weight data to API:", error);
    throw error;
  }
}

export async function updateWeightData(
  index: number,
  date: Date,
  weight: number
): Promise<void> {
  try {
    const formattedDate = date.toISOString().split("T")[0];

    const payload = {
      values: [[formattedDate, weight.toString()]],
      majorDimension: "ROWS",
    };

    const response = await axios.put(
      `${API_PUT_ENDPOINT}A${index + 2}:B${
        index + 2
      }?valueInputOption=USER_ENTERED`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    console.log("Data updated successfully:", response.data);
  } catch (error) {
    console.error("Error updating weight data to API:", error);
    throw error;
  }
}
