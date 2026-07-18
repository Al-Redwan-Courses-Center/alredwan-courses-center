export const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (typeof url !== "string") return null;

  if (url.startsWith("http")) {
    // Handle docker internal hostnames for local browser access
    return url.replace("redwan-backend", "localhost");
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Ensure the URL starts with a slash
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${normalizedUrl}`;
};
