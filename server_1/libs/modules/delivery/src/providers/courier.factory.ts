import { BadRequestException, Injectable } from '@nestjs/common';
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
    if (!providerCode || providerCode.trim().length === 0) {
      throw new BadRequestException('Provider code is required');
    }
    const code = providerCode.toUpperCase().trim();
    switch (code) {
      case CourierProvider.NIMBUS:
        return this.nimbus;
      case CourierProvider.SHIPROCKET:
        return this.shiprocket;
      default:
        throw new BadRequestException(`Unsupported courier provider: ${code}`);
    }
  }
}
