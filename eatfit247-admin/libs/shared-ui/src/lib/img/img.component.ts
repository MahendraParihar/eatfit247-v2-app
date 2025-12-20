import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IMediaUpload } from '@eatfit247-shared-lib';

@Component({
  selector: 'app-img',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './img.component.html',
  styleUrl: './img.component.scss'
})
export class ImgComponent implements OnInit {
  @Input() webUrl!: IMediaUpload[] | string;
  @Input() isAvatar = false;
  @Input() alt!: string;
  @Input() showPlaceholderOnError = false; // If false, hide the image on error instead of showing the placeholder
  imageUrl = '';
  showImage = true;

  ngOnInit(): void {
    this.processImageUrl();
  }

  private processImageUrl(): void {
    let rawImageUrl = '';
    if (this.webUrl) {
      if (Array.isArray(this.webUrl) && this.webUrl.length > 0) {
        rawImageUrl = this.webUrl[0]?.webUrl || '';
      } else if (typeof this.webUrl === 'string') {
        rawImageUrl = this.webUrl;
      }
    }
    if (rawImageUrl) {
      if (!rawImageUrl.startsWith('http://') && !rawImageUrl.startsWith('https://')) {
        // Ensure mediaPath ends with / and the image doesn't start with /
        const imagePath = rawImageUrl.startsWith('/') ? rawImageUrl.substring(1) : rawImageUrl;
        this.imageUrl = `${imagePath}`;
      } else {
        this.imageUrl = rawImageUrl;
      }
    } else {
      this.imageUrl = rawImageUrl;
    }
  }

  onImageError(): void {
    if (this.showPlaceholderOnError) {
      this.imageUrl = 'assets/images/placeholder.png';
    } else {
      this.showImage = false;
    }
  }
}
