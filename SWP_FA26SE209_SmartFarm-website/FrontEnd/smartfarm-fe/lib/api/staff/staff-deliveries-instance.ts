import { apiClient } from "../instance";
import { createStaffDeliveriesService } from "./staff-deliveries-service";

export const staffDeliveriesService = createStaffDeliveriesService(apiClient);
