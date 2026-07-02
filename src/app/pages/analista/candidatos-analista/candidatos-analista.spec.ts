import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatosAnalista } from './candidatos-analista';

describe('CandidatosAnalista', () => {
  let component: CandidatosAnalista;
  let fixture: ComponentFixture<CandidatosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatosAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatosAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
