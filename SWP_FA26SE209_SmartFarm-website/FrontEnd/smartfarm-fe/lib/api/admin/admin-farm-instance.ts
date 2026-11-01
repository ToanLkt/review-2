import { apiClient } from "../instance";
import { createAdminFarmService } from "./admin-farm-service";

export const adminFarmService = createAdminFarmService(apiClient);
