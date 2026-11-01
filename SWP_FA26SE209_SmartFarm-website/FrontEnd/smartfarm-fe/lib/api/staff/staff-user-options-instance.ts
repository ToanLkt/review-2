import { apiClient } from "../instance";
import { createStaffUserOptionsService } from "./staff-user-options-service";

export const staffUserOptionsService = createStaffUserOptionsService(apiClient);
