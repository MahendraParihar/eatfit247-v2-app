import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Referrer } from './referrer.component';

describe('Referrer', () => {
  let component: Referrer;
  let fixture: ComponentFixture<Referrer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Referrer],
    }).compileComponents();

    fixture = TestBed.createComponent(Referrer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
