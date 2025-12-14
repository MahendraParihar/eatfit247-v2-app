import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PocketGuide } from './pocket-guide';

describe('PocketGuide', () => {
  let component: PocketGuide;
  let fixture: ComponentFixture<PocketGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PocketGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(PocketGuide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
