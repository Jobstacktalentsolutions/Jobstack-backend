export interface SeedResult {
  success: boolean;
  message: string;
  count?: number;
  errors?: string[];
}

export interface ISeeder {
  run(entityNames: string[]): Promise<SeedResult>;
  getAvailableEntities(): string[];
}
