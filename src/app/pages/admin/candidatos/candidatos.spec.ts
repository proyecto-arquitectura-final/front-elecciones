import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Candidatos } from './candidatos';

describe('Candidatos', () => {
  let component: Candidatos;
  let fixture: ComponentFixture<Candidatos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Candidatos],
    }).compileComponents();

    fixture = TestBed.createComponent(Candidatos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
