import { apiClient } from "../instance";
import { createStaffFarmService } from "./staff-farm-service";

export const staffFarmService = createStaffFarmService(apiClient);
