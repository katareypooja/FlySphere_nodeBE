import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFlight } from './create-flight';

describe('CreateFlight', () => {
  let component: CreateFlight;
  let fixture: ComponentFixture<CreateFlight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFlight],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateFlight);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
