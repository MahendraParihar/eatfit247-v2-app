import { Injectable } from '@nestjs/common';
import { ICourierProvider } from './courier.interface';
import { NimbusAdapter } from './adapters/nimbus.adapter';
import { ShiprocketAdapter } from './adapters/shiprocket.adapter';
import { ShipwayAdapter } from './adapters/shipway.adapter';
import { CourierProviderUnsupportedError } from './adapters/courier-provider.error';

/**
 * Courier Factory
 * 
 * Responsibilities:
 * - Returns correct provider adapter based on provider code
 * - Throws error if provider is unsupported
 * - Uses Dependency Injection for adapter instances
 */
@Injectable()
export class CourierFactory {
  private readonly supportedProviders: readonly string[] = ['NIMBUS', 'SHIPROCKET', 'SHIPWAY'] as const;

  constructor(
    private readonly nimbus: NimbusAdapter,
    private readonly shiprocket: ShiprocketAdapter,
    private readonly shipway: ShipwayAdapter,
  ) {}

  /**
   * Get courier provider adapter by provider code
   * 
   * @param providerCode - The provider code (case-insensitive)
   * @returns The appropriate courier provider adapter
   * @throws CourierProviderUnsupportedError if provider code is not supported
   */
  getAdapter(providerCode: string): ICourierProvider {
    // Validate input
    if (!providerCode || typeof providerCode !== 'string') {
      throw new CourierProviderUnsupportedError(
        String(providerCode || 'undefined'),
        [...this.supportedProviders],
      );
    }

    const code = providerCode.toUpperCase().trim();

    switch (code) {
      case 'NIMBUS':
        return this.nimbus;
      case 'SHIPROCKET':
        return this.shiprocket;
      case 'SHIPWAY':
        return this.shipway;
      default:
        throw new CourierProviderUnsupportedError(
          code,
          [...this.supportedProviders],
        );
    }
  }

  /**
   * Check if provider is supported
   * 
   * @param providerCode - The provider code to check (case-insensitive)
   * @returns true if provider is supported, false otherwise
   */
  isProviderSupported(providerCode: string): boolean {
    if (!providerCode || typeof providerCode !== 'string') {
      return false;
    }
    const code = providerCode.toUpperCase().trim();
    return this.supportedProviders.includes(code);
  }

  /**
   * Get list of supported provider codes
   * 
   * @returns Array of supported provider codes
   */
  getSupportedProviders(): string[] {
    return [...this.supportedProviders];
  }
}

