import { SetMetadata } from '@nestjs/common';

export const PUBLIC_API = 'PUBLIC_API';
export const Public = () => SetMetadata(PUBLIC_API, true);
