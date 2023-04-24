import {Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from '@angular/core';
import {AdminUserStatusEnum} from "../../../enum/admin-user-status-enum";

@Directive({
  selector: '[appUserStatusBtn]'
})
export class UserStatusButtonDirective implements OnInit, OnChanges {
  adminStatusEnum = AdminUserStatusEnum;

  @Input()
  flag: number = this.adminStatusEnum.ACTIVE;

  constructor(private elRef: ElementRef,
              private render: Renderer2) {
    if (this.flag === this.adminStatusEnum.ACTIVE) {
      this.render.addClass(this.elRef.nativeElement, "blue-gradient-btn");
    } else if (this.flag === this.adminStatusEnum.IN_ACTIVE) {
      this.render.addClass(this.elRef.nativeElement, "red-gradient-btn");
    } else {
      this.render.addClass(this.elRef.nativeElement, "yellow-gradient-btn");
    }
    this.render.addClass(this.elRef.nativeElement, "round-btn");
    this.render.setStyle(this.elRef.nativeElement, "opacity", "0.7");
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['flag']['currentValue'] === this.adminStatusEnum.IN_ACTIVE) {
      this.render.removeClass(this.elRef.nativeElement, "yellow-gradient-btn");
      this.render.removeClass(this.elRef.nativeElement, "blue-gradient-btn");
      this.render.addClass(this.elRef.nativeElement, "red-gradient-btn");
    } else if (changes['flag']['currentValue'] === this.adminStatusEnum.ACTIVE) {
      this.render.removeClass(this.elRef.nativeElement, "yellow-gradient-btn");
      this.render.removeClass(this.elRef.nativeElement, "red-gradient-btn");
      this.render.addClass(this.elRef.nativeElement, "blue-gradient-btn");
    } else {
      this.render.removeClass(this.elRef.nativeElement, "blue-gradient-btn");
      this.render.removeClass(this.elRef.nativeElement, "red-gradient-btn");
      this.render.addClass(this.elRef.nativeElement, "yellow-gradient-btn");
    }
  }

  @HostListener('mouseover') onMouseOver() {
    this.render.setStyle(this.elRef.nativeElement, "opacity", "1");
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.render.setStyle(this.elRef.nativeElement, "opacity", "0.7");
  }
}
