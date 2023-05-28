import { Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appStatusBtn]',
})
export class StatusButtonDirective implements OnInit, OnChanges {
  @Input()
  flag: boolean = false;

  constructor(private elRef: ElementRef,
    private render: Renderer2) {
    if (this.flag) {
      this.render.addClass(this.elRef.nativeElement, 'blue-gradient-btn');
    } else {
      this.render.addClass(this.elRef.nativeElement, 'red-gradient-btn');
    }
    this.render.addClass(this.elRef.nativeElement, 'round-btn');
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '0.7');
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['flag']['currentValue'] === false) {
      this.render.removeClass(this.elRef.nativeElement, 'blue-gradient-btn');
      this.render.addClass(this.elRef.nativeElement, 'red-gradient-btn');
    } else {
      this.render.removeClass(this.elRef.nativeElement, 'red-gradient-btn');
      this.render.addClass(this.elRef.nativeElement, 'blue-gradient-btn');
    }
  }

  @HostListener('mouseover') onMouseOver() {
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '1');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.render.setStyle(this.elRef.nativeElement, 'opacity', '0.7');
  }
}
