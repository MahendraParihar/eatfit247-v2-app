import { readFileSync } from 'fs';
import { ICreateSeoPageDto } from '@eatfit247-shared-lib';
import { SeoPageService } from '@server_1/platform';

interface CsvRow {
  url: string;
  suggested_title: string;
  suggested_meta_description: string;
  suggested_canonical: string;
  suggested_og_type: string;
  suggested_og_title: string;
  suggested_og_description: string;
  suggested_og_url: string;
  suggested_twitter_card: string;
}

function parseCSV(csvContent: string): CsvRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  const records: CsvRow[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing - handles quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record as CsvRow);
    }
  }

  return records;
}

export async function seedSeoData(
  csvFilePath: string,
  seoPageService: SeoPageService,
  adminId: number = 1,
  ipAddress: string = '127.0.0.1',
): Promise<void> {
  try {
    // Read CSV file
    const csvContent = readFileSync(csvFilePath, 'utf-8');

    // Parse CSV
    const records: CsvRow[] = parseCSV(csvContent);

    console.log(`Found ${records.length} SEO records to process`);

    // Process each record
    for (const record of records) {
      if (!record.url || record.url.trim() === '') {
        console.warn('Skipping record with empty URL');
        continue;
      }

      // Extract path from full URL (e.g., https://eatfit24by7.com/our-programs/ -> /our-programs/)
      let urlPath = record.url;
      try {
        const urlObj = new URL(record.url);
        urlPath = urlObj.pathname;
        // Remove trailing slash if present
        if (urlPath.endsWith('/') && urlPath.length > 1) {
          urlPath = urlPath.slice(0, -1);
        }
      } catch (e) {
        // If URL parsing fails, use the original value
        console.warn(`Failed to parse URL: ${record.url}, using as-is`);
      }

      const seoData: ICreateSeoPageDto = {
        url: urlPath,
        metaTitle: record.suggested_title || undefined,
        metaDescription: record.suggested_meta_description || undefined,
        canonicalUrl: record.suggested_canonical || undefined,
        ogType: record.suggested_og_type || undefined,
        ogTitle: record.suggested_og_title || undefined,
        ogDescription: record.suggested_og_description || undefined,
        ogUrl: record.suggested_og_url || undefined,
        twitterCard: record.suggested_twitter_card || undefined,
        active: true,
      };

      try {
        await seoPageService.upsertByUrl(seoData, ipAddress, adminId);
        console.log(`✓ Processed: ${urlPath}`);
      } catch (error) {
        console.error(`✗ Failed to process ${urlPath}:`, error);
      }
    }

    console.log('SEO data seeding completed!');
  } catch (error) {
    console.error('Error seeding SEO data:', error);
    throw error;
  }
}

