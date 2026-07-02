import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenteAnalista } from './asistente-analista';

describe('AsistenteAnalista', () => {
  let component: AsistenteAnalista;
  let fixture: ComponentFixture<AsistenteAnalista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenteAnalista],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenteAnalista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
