import { useEffect } from "react";
import { InventoryUpdateEvent, ActivityLog } from "../types/inventory";

export const useInventoryUpdates = (
  setItems: (items: any[]) => void,
  setLogs: (logs: ActivityLog[]) => void
) => {
  useEffect(() => {
    const handler = (event: CustomEvent<InventoryUpdateEvent>) => {
      const { updatedItems, activityLog } = event.detail;
      setItems(updatedItems);

      if (activityLog) {
        setLogs(prev => {
          const exists = prev.some(log => log.id === activityLog.id);
          return exists ? prev : [activityLog, ...prev].slice(0, 100);
        });
      }
    };

    window.addEventListener("inventoryUpdated", handler as EventListener);
    return () => window.removeEventListener("inventoryUpdated", handler as EventListener);
  }, [setItems, setLogs]);
};
