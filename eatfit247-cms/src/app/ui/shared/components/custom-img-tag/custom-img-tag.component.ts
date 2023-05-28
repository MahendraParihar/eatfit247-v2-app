import { Component, Input, OnInit } from '@angular/core';
import { ApiUrlEnum } from '../../../../enum/api-url-enum';
import { MediaUploadResponseModel } from '../../../../models/media-upload-response.model';

@Component({
  selector: 'app-custom-img-tag',
  templateUrl: './custom-img-tag.component.html',
  styleUrls: ['./custom-img-tag.component.scss'],
})
export class CustomImgTagComponent implements OnInit {
  @Input()
  webUrl: MediaUploadResponseModel[];
  @Input()
  isAvatar: boolean = true;
  @Input()
  alt: string = '';
  imageUrl: string;
  apiUrlEnum = ApiUrlEnum;

  constructor() {
  }

  ngOnInit(): void {
    if (this.webUrl) {
      if (Array.isArray(this.webUrl) && this.webUrl.length > 0) {
        this.imageUrl = this.webUrl[0].webUrl;
      } else {
        // custom img show
      }
    } else {
      // custom img show
    }
  }
}
