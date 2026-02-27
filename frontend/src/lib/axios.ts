"use server";

import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REST_API_URL,
});

export default apiClient;
