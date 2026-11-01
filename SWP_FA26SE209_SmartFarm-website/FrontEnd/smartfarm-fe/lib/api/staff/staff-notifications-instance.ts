import { apiClient } from "../instance";
import { createStaffNotificationsService } from "./staff-notifications-service";

export const staffNotificationsService = createStaffNotificationsService(apiClient);
