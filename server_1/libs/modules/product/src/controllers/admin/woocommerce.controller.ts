import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { WooCommerceService } from '@server_1/platform';
import { CreateWooCommerceOrderRequestDto } from '../../dto/woocommerce.dto';

@Controller('woocommerce/orders')
@UseGuards(JwtAuthGuard)
export class WooCommerceController {
  constructor(private readonly wooCommerceService: WooCommerceService) {}

  /**
   * Create a new order in WooCommerce
   * POST /woocommerce/orders
   */
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateWooCommerceOrderRequestDto,
  ) {
    return await this.woCommerceService.createOrder(createOrderDto);
  }

  /**
   * Get order details by order ID
   * GET /woocommerce/orders/:orderId
   */
  @Get(':orderId')
  async getOrderDetails(@Param('orderId') orderId: number) {
    return await this.woCommerceService.getOrderById(orderId);
  }

  /**
   * Track order status and details
   * GET /woocommerce/orders/:orderId/track
   */
  @Get(':orderId/track')
  async trackOrder(@Param('orderId') orderId: number) {
    return await this.woCommerceService.trackOrder(orderId);
  }
}

