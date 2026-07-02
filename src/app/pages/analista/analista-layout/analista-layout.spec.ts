import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalistaLayout } from './analista-layout';

describe('AnalistaLayout', () => {
  let component: AnalistaLayout;
  let fixture: ComponentFixture<AnalistaLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalistaLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalistaLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
