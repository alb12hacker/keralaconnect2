export const navState = (() => {
  let selectedVehicleId: string | null = null;
  const listeners: (() => void)[] = [];

  return {
    getSelectedVehicleId() {
      return selectedVehicleId;
    },
    setSelectedVehicleId(id: string | null) {
      selectedVehicleId = id;
      listeners.forEach(l => l());
    },
    subscribe(listener: () => void) {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }
  };
})();
