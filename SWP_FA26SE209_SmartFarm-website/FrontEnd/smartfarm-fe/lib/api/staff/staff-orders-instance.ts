import { apiClient } from "../instance";
import { createStaffOrdersService } from "./staff-orders-service";

export const staffOrdersService = createStaffOrdersService(apiClient);
