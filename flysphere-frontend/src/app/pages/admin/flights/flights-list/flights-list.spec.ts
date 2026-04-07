import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightsList } from './flights-list';

describe('FlightsList', () => {
  let component: FlightsList;
  let fixture: ComponentFixture<FlightsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightsList],
    }).compileComponents();

    fixture = TestBed.createComponent(FlightsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
