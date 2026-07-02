import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestasAnalista } from './encuestas-analista';

describe('EncuestasAnalista', () => {
  let component: EncuestasAnalista;
  let fixture: ComponentFixture<EncuestasAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestasAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(EncuestasAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
