import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'lib-member-payment-history',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './member-payment-history.component.html',
  styleUrl: './member-payment-history.component.scss'
})
export class MemberPaymentHistoryComponent implements OnInit {
  memberId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
    });
  }
}
