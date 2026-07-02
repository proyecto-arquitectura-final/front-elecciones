import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Encuestas } from './encuestas';

describe('Encuestas', () => {
  let component: Encuestas;
  let fixture: ComponentFixture<Encuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Encuestas],
    }).compileComponents();

    fixture = TestBed.createComponent(Encuestas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
