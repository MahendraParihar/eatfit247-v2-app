import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'lib-member-body-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './member-body-stats.component.html',
  styleUrl: './member-body-stats.component.scss'
})
export class MemberBodyStatsComponent implements OnInit {
  memberId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
    });
  }
}
