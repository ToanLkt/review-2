import { apiClient } from "../instance";
import { createStaffPaymentsService } from "./staff-payments-service";

export const staffPaymentsService = createStaffPaymentsService(apiClient);
