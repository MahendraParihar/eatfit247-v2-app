import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaPress } from './media-press';

describe('MediaPress', () => {
  let component: MediaPress;
  let fixture: ComponentFixture<MediaPress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaPress],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaPress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
