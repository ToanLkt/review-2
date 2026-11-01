import { apiClient } from "../instance";
import { createAdminReportsService } from "./admin-reports-service";

export const adminReportsService = createAdminReportsService(apiClient);
