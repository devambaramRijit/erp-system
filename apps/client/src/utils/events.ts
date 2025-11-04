import { InventoryUpdateEvent } from "../types/inventory";

export const dispatchInventoryUpdate = (payload: InventoryUpdateEvent) => {
  window.dispatchEvent(new CustomEvent<InventoryUpdateEvent>("inventoryUpdated", { detail: payload }));
};
