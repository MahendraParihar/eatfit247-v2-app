import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IGoogleReview, IGoogleReviewReply } from '@eatfit247-shared-lib';

@Injectable({ providedIn: 'root' })
export class GoogleReviewsApiService extends CrudApiService<IGoogleReview> {
  constructor() {
    super('/google-review');
  }

  async reply(id: number, body: IGoogleReviewReply): Promise<void> {
    await this.httpService.patch<void>(`${this.endpoint}/reply/${id}`, body);
  }
}
