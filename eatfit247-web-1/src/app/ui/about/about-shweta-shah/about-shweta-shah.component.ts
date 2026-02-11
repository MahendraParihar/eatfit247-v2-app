import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ContainerComponent, SectionComponent } from '@shared-ui/layout';

@Component({
  standalone: true,
  selector: 'app-about-shweta-shah',
  imports: [CommonModule, SectionComponent, ContainerComponent],
  templateUrl: './about-shweta-shah.component.html',
  styleUrl: './about-shweta-shah.component.scss',
})
export class AboutShwetaShahComponent {}


