import { apiClient } from "../instance";
import { createAdminFarmConfigService } from "./admin-farm-config-service";

export const adminFarmConfigService = createAdminFarmConfigService(apiClient);
