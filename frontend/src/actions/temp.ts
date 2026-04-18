"use server";

import { getServerJwtToken } from "@/actions/auth";

export async function getClientAccessToken() {
  const token = await getServerJwtToken();

  return token?.jwt_access_token;
}
