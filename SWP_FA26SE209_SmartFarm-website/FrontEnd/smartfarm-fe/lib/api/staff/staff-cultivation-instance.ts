import { apiClient } from "../instance";
import { createStaffCultivationService } from "./staff-cultivation-service";

export const staffCultivationService = createStaffCultivationService(apiClient);
