import {Injectable} from '@angular/core';
import {SharedService} from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  loader: any[] = [];
  isLoading = false;

  constructor(private sharedService: SharedService) {
  }


  load(): void {
    this.sharedService.setLoader(true);
  }

  dismiss(): void {
    this.sharedService.setLoader(false);
  }
}
