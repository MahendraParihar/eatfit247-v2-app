import { Injectable } from '@nestjs/common';
import { ICourierProvider } from './courier.interface';
import { NimbusAdapter } from './adapters/nimbus.adapter';
import { ShiprocketAdapter } from './adapters/shiprocket.adapter';
import { CourierProvider } from '@eatfit247-shared-lib';

@Injectable()
export class CourierFactory {
  constructor(
    private readonly nimbus: NimbusAdapter,
    private readonly shiprocket: ShiprocketAdapter,
  ) {}

  getAdapter(providerCode: string): ICourierProvider {
    // Validate input
    const code = providerCode.toUpperCase().trim();
    switch (code) {
      case CourierProvider.NIMBUS:
        return this.nimbus;
      case CourierProvider.SHIPROCKET:
        return this.shiprocket;
      default:
        throw new Error(`Unsupported courier provider: ${code}`);
    }
  }
}
