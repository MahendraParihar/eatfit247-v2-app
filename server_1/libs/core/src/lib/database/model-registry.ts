import { ModelCtor } from 'sequelize-typescript';

/**
 * Model Registry
 * Allows lib modules to register their models without app.module.ts needing to know about them
 */
class ModelRegistry {
  private models: ModelCtor[] = [];
  private modelSet: Set<ModelCtor> = new Set();

  /**
   * Register models from a lib module
   * Prevents duplicate registrations to avoid Sequelize association conflicts
   */
  register(models: ModelCtor[]): void {
    for (const model of models) {
      if (!this.modelSet.has(model)) {
        this.modelSet.add(model);
        this.models.push(model);
      }
    }
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
    this.modelSet.clear();
  }
}

export const modelRegistry = new ModelRegistry();
