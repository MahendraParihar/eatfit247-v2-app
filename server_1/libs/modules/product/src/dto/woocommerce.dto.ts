import { ICreateWooCommerceOrderDto, IWooCommerceBillingAddress, IWooCommerceOrderItem } from '@eatfit247-shared-lib';

export class CreateWooCommerceOrderRequestDto implements ICreateWooCommerceOrderDto {
  payment_method?: string;
  payment_method_title?: string;
  set_paid?: boolean;
  billing: IWooCommerceBillingAddress;
  shipping?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: IWooCommerceOrderItem[];
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  meta_data?: Array<{
    key: string;
    value: string | number | boolean;
  }>;
  customer_note?: string;
}

