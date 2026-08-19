export const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (typeof url !== "string") return null;

  if (url.startsWith("http")) {
    // Handle docker internal hostnames for local browser access
    return url.replace("redwan-backend", "localhost");
  }

  const getApiBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || process.env.REST_API_URL;
    if (!url) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("NEXT_PUBLIC_API_URL is missing in production environment!");
      }
      return "http://localhost:8000";
    }
    return url;
  };
  const baseUrl = getApiBaseUrl();
  // Ensure the URL starts with a slash
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${normalizedUrl}`;
};
