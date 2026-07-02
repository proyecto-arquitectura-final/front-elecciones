import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadosAnalista } from './resultados-analista';

describe('ResultadosAnalista', () => {
  let component: ResultadosAnalista;
  let fixture: ComponentFixture<ResultadosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadosAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultadosAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
