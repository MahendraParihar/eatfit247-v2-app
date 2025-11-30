import { Module, forwardRef } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { AppModule } from '../../app.module';

@Module({
  imports: [
    forwardRef(() => AppModule),
  ],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
