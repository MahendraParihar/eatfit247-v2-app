import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { NavigationService } from '../../service/navigation.service';
import { Router } from '@angular/router';
import { NavItem } from '../../interfaces/nav-item';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)'),
      ),
    ]),
  ],
})
export class SideMenuComponent implements OnInit {
  expanded = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item?: NavItem;
  @Input() depth?: number;
  @Output() onNavigate = new EventEmitter<void>();

  constructor(public navService: NavigationService,
    public router: Router) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {
    this.navService.getCurrentUrl().subscribe((url: string) => {
      if (this.item.path) {
        this.expanded = url.indexOf(`/${this.item.path}`) === 0;
        this.ariaExpanded = this.expanded;
      }
    });
  }

  onItemSelected(item: NavItem): void {
    if (!item.children || !item.children.length) {
      if (item.path) {
        this.navService.navigateTo(item.path);
      }
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }

  onMenuClick(item: NavItem) {
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
    if (item.path) {
      this.onNavigate.emit();
      this.navService.navigateTo(item.path);
    }
  }

  onChildNavigate() {
    this.onNavigate.emit();
  }
}


