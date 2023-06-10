import { Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { AdminUserStatusEnum } from '../../../enum/admin-user-status-enum';

@Directive({
  selector: '[triStatusBtn]',
})
export class TriStatusButtonDirective implements OnInit, OnChanges {
  adminStatusEnum = AdminUserStatusEnum;

  @Input()
  flag: number = 0;

  constructor(private elRef: ElementRef,
    private render: Renderer2) {
    if (this.flag === 0) {
      this.render.addClass(this.elRef.nativeElement, 'blue-gradient-btn');
    } else if (this.flag === -1) {
      this.render.addClass(this.elRef.nativeElement, 'red-gradient-btn');
    } else if (this.flag === 1) {
      this.render.addClass(this.elRef.nativeElement, 'yellow-gradient-btn');
    }
    this.render.addClass(this.elRef.nativeElement, 'round-btn');
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '0.7');
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['flag']['currentValue'] === -1) {
      this.render.removeClass(this.elRef.nativeElement, 'yellow-gradient-btn');
      this.render.removeClass(this.elRef.nativeElement, 'blue-gradient-btn');
      this.render.addClass(this.elRef.nativeElement, 'red-gradient-btn');
    } else if (changes['flag']['currentValue'] === 0) {
      this.render.removeClass(this.elRef.nativeElement, 'yellow-gradient-btn');
      this.render.removeClass(this.elRef.nativeElement, 'red-gradient-btn');
      this.render.addClass(this.elRef.nativeElement, 'blue-gradient-btn');
    } else if (changes['flag']['currentValue'] === 1) {
      this.render.removeClass(this.elRef.nativeElement, 'blue-gradient-btn');
      this.render.removeClass(this.elRef.nativeElement, 'red-gradient-btn');
      this.render.addClass(this.elRef.nativeElement, 'yellow-gradient-btn');
    }
  }

  @HostListener('mouseover') onMouseOver() {
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '1');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '0.7');
  }
}
