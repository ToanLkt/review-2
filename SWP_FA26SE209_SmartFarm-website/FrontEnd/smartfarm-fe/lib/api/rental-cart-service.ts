import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { RentalOrder } from "./rental-service";
import type { ApiResponse } from "./types";

export type AddRentalCartItemRequest = {
  seedVarietyId: number;
  farmAreaId?: number | null;
  totalCycles: number;
  targetPlantingDate?: string | null;
};

export type RentalCartItem = {
  cartItemId: number;
  seedVarietyId: number;
  seedVarietyName: string | null;
  farmAreaId: number | null;
  farmAreaName: string | null;
  quantity: number;
  totalCycles: number;
  targetPlantingDate: string | null;
  rentalPrice: number;
  lineTotal: number;
  addedAt: string;
};

export type RentalCart = {
  cartId: number;
  items: RentalCartItem[] | null;
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

export type CheckoutRentalCartRequest = {
  isRiskAccepted: boolean;
  shippingAddress: string;
  shippingLatitude: number;
  shippingLongitude: number;
  isAccepted: boolean;
  cartItemIds: number[];
};

export type AddRentalCartItemsProgress = {
  completed: number;
  total: number;
};

export type AddRentalCartItemsResult = {
  cart: RentalCart;
  addedCount: number;
  remainingRequests: AddRentalCartItemRequest[];
  error: unknown | null;
  synchronizationFailed: boolean;
};

export type AddRentalCartItemsOptions = {
  initialCart?: RentalCart;
  onProgress?: (progress: AddRentalCartItemsProgress) => void;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function cartItemPath(cartItemId: number) {
  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    throw new Error("cartItemId must be a positive integer.");
  }
  return `/cart/items/${cartItemId}`;
}

export function createRentalCartService(client: ApiClient = apiClient) {
  async function getCart() {
    const response = await client.get<RentalCart>("/cart");
    return unwrap(response, "Không thể tải giỏ thuê khay.");
  }

  async function addItem(request: AddRentalCartItemRequest) {
    const response = await client.post<RentalCart, AddRentalCartItemRequest>(
      "/cart/items",
      request,
    );
    return unwrap(response, "Không thể thêm khay vào giỏ thuê.");
  }

  return {
    getCart,
    addItem,

    async removeItem(cartItemId: number) {
      const response = await client.delete<RentalCart>(cartItemPath(cartItemId));
      return unwrap(response, "Không thể xóa dòng khỏi giỏ thuê.");
    },

    async clearCart() {
      const response = await client.delete<RentalCart>("/cart");
      return unwrap(response, "Không thể xóa giỏ thuê.");
    },

    async checkout(request: CheckoutRentalCartRequest) {
      const response = await client.post<RentalOrder, CheckoutRentalCartRequest>(
        "/cart/checkout",
        request,
      );
      return unwrap(response, "Không thể checkout giỏ thuê.");
    },

    async addItemsSequentially(
      requests: AddRentalCartItemRequest[],
      options: AddRentalCartItemsOptions = {},
    ): Promise<AddRentalCartItemsResult> {
      const initialCart = options.initialCart ?? await getCart();
      let latestCart = initialCart;
      let addedCount = 0;

      for (const request of requests) {
        options.onProgress?.({ completed: addedCount, total: requests.length });
        try {
          latestCart = await addItem(request);
          addedCount += 1;
          options.onProgress?.({ completed: addedCount, total: requests.length });
        } catch (error) {
          try {
            const synchronizedCart = await getCart();
            const observedAdds = Math.max(0, synchronizedCart.itemCount - initialCart.itemCount);
            const verifiedAddedCount = Math.min(
              requests.length,
              Math.max(addedCount, observedAdds),
            );
            return {
              cart: synchronizedCart,
              addedCount: verifiedAddedCount,
              remainingRequests: requests.slice(verifiedAddedCount),
              error,
              synchronizationFailed: false,
            };
          } catch {
            return {
              cart: latestCart,
              addedCount,
              remainingRequests: requests.slice(addedCount),
              error,
              synchronizationFailed: true,
            };
          }
        }
      }

      try {
        latestCart = await getCart();
      } catch {
        // Every POST was acknowledged. Keep the latest add response and let the destination reload.
      }

      return {
        cart: latestCart,
        addedCount,
        remainingRequests: [],
        error: null,
        synchronizationFailed: false,
      };
    },
  };
}

export const rentalCartService = createRentalCartService();
