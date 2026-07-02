import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Elecciones } from './elecciones';

describe('Elecciones', () => {
  let component: Elecciones;
  let fixture: ComponentFixture<Elecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Elecciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Elecciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
