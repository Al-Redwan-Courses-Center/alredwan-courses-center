"use server";

import axios, { type AxiosInstance } from "axios";
import { getServerJwtToken } from "@/actions/auth";

const getApiBaseUrl = () => {
  const url = process.env.REST_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    return "http://localhost:8000";
  }
  return url;
};

export const publicApiClient: AxiosInstance = axios.create();

publicApiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

const authApiClient: AxiosInstance = axios.create();

authApiClient.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
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
