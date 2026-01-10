import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialIconsComponent, SocialLink } from '../social-icons/social-icons.component';

@Component({
  selector: 'app-join-shweta-shah',
  standalone: true,
  imports: [CommonModule, SocialIconsComponent],
  templateUrl: './join-shweta-shah.component.html',
  styleUrl: './join-shweta-shah.component.scss'
})
export class JoinShwetaShahComponent {
  @Input() title: string = 'Join with Shweta Shah';
  @Input() description: string = 'EatFit247 is a dream venture and your answer to weight loss reality and natural health care options without compromising your lifestyle. We pride ourselves in creating a plan that not only meets your health goals but allows you to retain your foodie cravings.';
  @Input() socialLinks: SocialLink[] = [];
  @Input() showLabels: boolean = false;
  @Input() iconSize: 'small' | 'medium' | 'large' = 'medium';
}

