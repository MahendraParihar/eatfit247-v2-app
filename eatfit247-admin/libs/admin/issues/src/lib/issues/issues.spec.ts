import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Issues } from './issues.component';

describe('Issues', () => {
  let component: Issues;
  let fixture: ComponentFixture<Issues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Issues],
    }).compileComponents();

    fixture = TestBed.createComponent(Issues);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
