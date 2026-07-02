import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesAnalista } from './reportes-analista';

describe('ReportesAnalista', () => {
  let component: ReportesAnalista;
  let fixture: ComponentFixture<ReportesAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
