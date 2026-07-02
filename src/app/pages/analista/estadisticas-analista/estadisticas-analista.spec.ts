import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasAnalista } from './estadisticas-analista';

describe('EstadisticasAnalista', () => {
  let component: EstadisticasAnalista;
  let fixture: ComponentFixture<EstadisticasAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticasAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
