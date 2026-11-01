import { createApiClient } from "./client";
import { customerSession } from "../customer-session";

const frontendOrigin = typeof window === "undefined"
  ? "http://localhost:3000"
  : window.location.origin;

export const apiClient = createApiClient({
  baseUrl: frontendOrigin,
  apiPrefix: "/backend-api/v1",
  onUnauthorized: () => customerSession.clear(),
});
