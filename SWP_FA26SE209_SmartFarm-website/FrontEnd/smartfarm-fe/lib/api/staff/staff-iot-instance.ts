import { apiClient } from "../instance";
import { createStaffIoTService } from "./staff-iot-service";
export const staffIoTService = createStaffIoTService(apiClient);
