import { apiClient } from "../instance";
import { createAdminUsersService } from "./admin-users-service";

export const adminUsersService = createAdminUsersService(apiClient);
