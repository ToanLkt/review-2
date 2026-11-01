import { apiClient } from "../instance";
import { createStaffTelemetryService } from "./staff-telemetry-service";

export const staffTelemetryService = createStaffTelemetryService(apiClient);
