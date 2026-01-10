import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicProgram, IPublicTableList } from 'eatfit247-shared-library';

export interface Program {
  id: number;
  title: string;
  punchLine: string;
  description: string;
  category: string;
  categoryId: number;
  imageUrl?: string;
  idealFor?: string[];
  tags?: string[];
  url: string;
  videoUrl?: string;
  isSpecialProgram: boolean;
}

/**
 * Service to manage program data
 * Loads programs from the public API
 */
@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all programs
   */
  async getAllPrograms(): Promise<Program[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicProgram>>(
        'public/program/list',
        {
          page: '0',
          limit: '1000'
        }
      );
      if (data) {
        return data.tableData.map((program: IPublicProgram) => this.mapProgram(program));
      }
      return [];
    } catch (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
  }

  /**
   * Get program by ID
   */
  async getProgramById(id: number): Promise<Program | null> {
    try {
      const program = await this.httpService.get<IPublicProgram>(`public/program/${id}`);
      return program ? this.mapProgram(program) : null;
    } catch (error) {
      console.error('Error fetching program:', error);
      return null;
    }
  }

  /**
   * Get program by URL
   */
  async getProgramByUrl(url: string): Promise<Program | null> {
    try {
      const encodedUrl = encodeURIComponent(url);
      const program = await this.httpService.get<IPublicProgram>(`public/program/by-url/${encodedUrl}`);
      return program ? this.mapProgram(program) : null;
    } catch (error) {
      console.error('Error fetching program by URL:', error);
      return null;
    }
  }

  /**
   * Map IPublicProgram from API to Program
   */
  private mapProgram(program: IPublicProgram): Program {
    // Get the first image from imagePath array
    const firstImage = program.imagePath && program.imagePath.length > 0
      ? program.imagePath[0]
      : null;
    const imageUrl = firstImage?.webUrl || '';
    // Convert idealFor from string to array if needed
    let idealFor: string[] = [];
    if (program.idealFor) {
      if (typeof program.idealFor === 'string') {
        idealFor = program.idealFor.split(',').map(item => item.trim()).filter(item => item.length > 0);
      } else if (Array.isArray(program.idealFor)) {
        idealFor = program.idealFor;
      }
    }
    // Convert tags from array or string
    let tags: string[] = [];
    // Strip HTML tags from description
    let description = program.details || '';
    if (description) {
      description = description.replace(/<[^>]*>/g, '').trim();
    }
    return {
      id: program.programId,
      title: program.program,
      punchLine: program.punchLine || '',
      description: description,
      category: program.programCategory || '',
      categoryId: program.programCategoryId,
      imageUrl: imageUrl,
      idealFor: idealFor,
      tags: tags,
      url: program.seo?.url || '',
      videoUrl: program.videoUrl,
      isSpecialProgram: program.isSpecialProgram
    };
  }
}

