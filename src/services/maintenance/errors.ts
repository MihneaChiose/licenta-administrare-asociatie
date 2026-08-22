export class MaintenanceCalculationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "MaintenanceCalculationError";
  }
}
