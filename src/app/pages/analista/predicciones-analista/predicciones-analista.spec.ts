import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrediccionesAnalista } from './predicciones-analista';

describe('PrediccionesAnalista', () => {
  let component: PrediccionesAnalista;
  let fixture: ComponentFixture<PrediccionesAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionesAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionesAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
