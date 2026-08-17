"use server";

import axios, { type AxiosInstance } from "axios";
import { getServerJwtToken } from "@/actions/auth";

const getApiBaseUrl = () => {
  const url = process.env.REST_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("REST_API_URL or NEXT_PUBLIC_API_URL is missing in production environment!");
    }
    return "http://localhost:8000";
  }
  return url;
};

const baseConfig = {
  baseURL: getApiBaseUrl(),
};

export const publicApiClient: AxiosInstance = axios.create(baseConfig);

const authApiClient: AxiosInstance = axios.create(baseConfig);

authApiClient.interceptors.request.use(async (config) => {
  const token = await getServerJwtToken();
  const jwtAccessToken = token?.jwt_access_token;

  if (!jwtAccessToken) {
    return Promise.reject(
      new Error("Missing JWT access token for protected request."),
    );
  }

  config.headers.Authorization = `JWT ${jwtAccessToken}`;
  return config;
});

/** Shared instance; JWT is applied per request via interceptor (no `axios.create` per call). */
export async function getAuthApiClient(): Promise<AxiosInstance> {
  return authApiClient;
}
