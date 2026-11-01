import { apiClient } from "../instance";
import { createStaffInventoryService } from "./staff-inventory-service";

export const staffInventoryService = createStaffInventoryService(apiClient);
