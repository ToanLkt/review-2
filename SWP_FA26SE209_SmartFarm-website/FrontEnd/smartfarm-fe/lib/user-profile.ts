export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarInitial: string;
  activeTrays: number;
  totalOrders: number;
  memberSince: string;
};

export const initialUserProfile: UserProfile = {
  name: "Ngọc Anh",
  email: "user@smartfarm.vn",
  phone: "090 123 4567",
  address: "25 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
  avatarInitial: "N",
  activeTrays: 3,
  totalOrders: 12,
  memberSince: "01/2024",
};
