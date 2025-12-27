import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'lib-member-assessment',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './member-assessment.component.html',
  styleUrl: './member-assessment.component.scss'
})
export class MemberAssessmentComponent implements OnInit {
  memberId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
    });
  }
}
