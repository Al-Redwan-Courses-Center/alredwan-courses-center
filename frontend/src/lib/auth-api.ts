"use server";

import { getServerJwtToken } from "@/actions/auth";
import axios from "axios";

const baseConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
};

export async function getAuthApiClient() {
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
