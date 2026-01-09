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

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw4qVhqYSw_J3_zfk3rZQtgw3z2hwPvT3W_gBz3gM6s4WnNPIP5UAf66tSMoQ1DJxm8gA/exec";

export async function fetchWeightData(): Promise<WeightData[]> {
  try {
    const response = await axios.get<ApicoResponse>(
      `${GOOGLE_SCRIPT_URL}?action=getData`
    );

    console.log("Raw API Response:", response.data);

    const values = response.data.values || response.data;
    const weightData: WeightData[] = values.slice(1).map((row: string[]) => {
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

    const response = await axios.get(
      `${GOOGLE_SCRIPT_URL}?action=addData&date=${formattedDate}&weight=${weight}`
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

    const response = await axios.get(
      `${GOOGLE_SCRIPT_URL}?action=updateData&row=${
        index + 2
      }&date=${formattedDate}&weight=${weight}`
    );

    console.log("Data updated successfully:", response.data);
  } catch (error) {
    console.error("Error updating weight data to API:", error);
    throw error;
  }
}
