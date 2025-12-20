import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Franchise } from './franchise.component';

describe('Franchise', () => {
  let component: Franchise;
  let fixture: ComponentFixture<Franchise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Franchise],
    }).compileComponents();

    fixture = TestBed.createComponent(Franchise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
