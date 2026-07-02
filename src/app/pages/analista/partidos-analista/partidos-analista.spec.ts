import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartidosAnalista } from './partidos-analista';

describe('PartidosAnalista', () => {
  let component: PartidosAnalista;
  let fixture: ComponentFixture<PartidosAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartidosAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(PartidosAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
