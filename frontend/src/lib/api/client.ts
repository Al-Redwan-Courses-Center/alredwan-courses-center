"use server";

import { getServerJwtToken } from "@/actions/auth";
import axios, { type AxiosInstance } from "axios";

const baseConfig = {
  baseURL: process.env.REST_API_URL,
};

export const publicApiClient: AxiosInstance = axios.create(baseConfig);

export async function getAuthApiClient(): Promise<AxiosInstance> {
  const token = await getServerJwtToken();
  const jwtAccessToken = token?.jwt_access_token;

  if (!jwtAccessToken) {
    throw new Error("Missing JWT access token for protected request.");
  }

  return axios.create({
    ...baseConfig,
    headers: {
      Authorization: `JWT ${jwtAccessToken}`,
    },
  });
}
