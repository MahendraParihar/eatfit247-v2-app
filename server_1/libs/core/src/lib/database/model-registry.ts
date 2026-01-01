import { ModelCtor } from 'sequelize-typescript';

/**
 * Model Registry
 * Allows lib modules to register their models without app.module.ts needing to know about them
 */
class ModelRegistry {
  private models: ModelCtor[] = [];

  /**
   * Register models from a lib module
   */
  register(models: ModelCtor[]): void {
    this.models.push(...models);
  }

  /**
   * Get all registered models
   */
  getAllModels(): ModelCtor[] {
    return [...this.models];
  }

  /**
   * Clear all registered models (useful for testing)
   */
  clear(): void {
    this.models = [];
  }
}

export const modelRegistry = new ModelRegistry();
