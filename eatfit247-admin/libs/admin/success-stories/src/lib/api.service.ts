import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { ISuccessStory } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class SuccessStoriesApiService extends CrudApiService<ISuccessStory> {
  constructor() {
    super('/success-story');
  }
}
