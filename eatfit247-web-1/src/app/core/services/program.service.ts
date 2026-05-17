import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicProgram, IPublicTableList } from '@eatfit247-shared-library/core';
import { buildMediaUrl } from '../utils/media-url.util';

export type SeasonalStatus = 'live' | 'soon' | 'closed';

export interface SeasonalProgramCard {
  programId: number;
  slug: string;
  title: string;
  word: string;
  subtitle: string;
  details: string;
  status: SeasonalStatus;
  statusLabel: string;
  datePill: string;
  maxPeopleCanRegister: number | null;
  coverImg: string;
  ctaLabel: string;
  ctaIcon: string;
  ctaIntent: 'reserve' | 'waitlist';
  ctaVariant: 'filled' | 'outlined';
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly httpService = inject(HttpService);

  async getSeasonalPrograms(): Promise<SeasonalProgramCard[]> {
    try {
      const res = await this.httpService.get<IPublicTableList<IPublicProgram>>('program/list', {
        params: { isSpecialProgram: true, limit: 50 },
      });
      const rows = res?.data?.tableData ?? [];
      return rows.map((p) => this.toCard(p));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching seasonal programs:', error);
      return [];
    }
  }

  private toCard(p: IPublicProgram): SeasonalProgramCard {
    const status = this.deriveStatus(p.startDate, p.endDate);
    const firstWord = (p.program ?? '').trim().split(/\s+/)[0] ?? '';
    const cover = p.imagePath && p.imagePath.length > 0 ? buildMediaUrl(p.imagePath[0]?.webUrl) : '';
    return {
      programId: p.programId,
      slug: p.seo?.url ?? String(p.programId),
      title: p.program,
      word: firstWord.toUpperCase(),
      subtitle: p.punchLine ?? '',
      details: p.details ?? '',
      status,
      statusLabel: this.statusLabel(status, p.startDate),
      datePill: this.datePill(status, p.startDate, p.endDate),
      maxPeopleCanRegister: p.maxPeopleCanRegister ?? null,
      coverImg: cover,
      ctaLabel: status === 'live' ? 'Reserve Spot' : status === 'soon' ? 'Notify Me' : 'Join Waitlist',
      ctaIcon: status === 'live' ? 'arrow_forward' : status === 'soon' ? 'notifications_active' : 'arrow_forward',
      ctaIntent: status === 'live' ? 'reserve' : 'waitlist',
      ctaVariant: status === 'closed' ? 'outlined' : 'filled',
    };
  }

  private toDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private deriveStatus(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined,
  ): SeasonalStatus {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end && end.getTime() < today.getTime()) return 'closed';
    if (start && start.getTime() > today.getTime()) return 'soon';
    return 'live';
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private statusLabel(status: SeasonalStatus, startDate: string | Date | null | undefined): string {
    if (status === 'live') return 'Open now';
    if (status === 'closed') return 'Off-season';
    const start = this.toDate(startDate);
    return start ? `Opens ${this.formatDate(start)}` : 'Opening soon';
  }

  private datePill(
    status: SeasonalStatus,
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined,
  ): string {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);
    if (status === 'closed') {
      return end ? `Ended ${this.formatDate(end)}` : 'Next batch · TBD';
    }
    if (start) return `Starts ${this.formatDate(start)}`;
    return 'New batch soon';
  }
}
