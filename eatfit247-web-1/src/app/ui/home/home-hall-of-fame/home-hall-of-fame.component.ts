import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ISuccessStory } from '@eatfit247-shared-library/core';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-home-hall-of-fame',
  imports: [CommonModule, MatIcon, MatMiniFabButton],
  templateUrl: './home-hall-of-fame.component.html',
  styleUrl: './home-hall-of-fame.component.scss'
})
export class HomeHallOfFameComponent implements OnInit {
  @Input() stories: ISuccessStory[] = [];
  currentIndex = 0;

  async ngOnInit(): Promise<void> {
    this.currentIndex = 0;
  }

  next() {
    if (this.currentIndex >= this.stories.length - 1) {
      return;
    }
    this.currentIndex++;
  }

  prev() {
    if (this.currentIndex <= 0) {
      return;
    }
    this.currentIndex--;
  }

  getStoryImage(story: ISuccessStory): string | unknown {
    return story.imagePath && story.imagePath.length > 0
      ? story.imagePath[0].webUrl
      : undefined;
  }
}


