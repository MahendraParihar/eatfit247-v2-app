/**
 * Standalone script to seed SEO data from CSV file
 * 
 * Usage:
 *   npx ts-node server_1/libs/modules/pages/src/scripts/run-seed.ts <path-to-csv-file>
 * 
 * Example:
 *   npx ts-node server_1/libs/modules/pages/src/scripts/run-seed.ts /Users/mahendraparihar/Downloads/eatfit24by7_seo_each_link_seed.csv
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../apps/public-api/src/app/app.module';
import { SeoPageService } from '../services/seo-page.service';
import { seedSeoData } from './seed-seo-data';

async function bootstrap() {
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('Error: CSV file path is required');
    console.log('Usage: npx ts-node run-seed.ts <path-to-csv-file>');
    process.exit(1);
  }

  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const seoPageService = app.get(SeoPageService);
    
    console.log(`Reading CSV file: ${csvFilePath}`);
    await seedSeoData(csvFilePath, seoPageService, 1, '127.0.0.1');
    
    await app.close();
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

bootstrap();

