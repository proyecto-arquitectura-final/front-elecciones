import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AnalistaLayout } from './analista-layout';

describe('AnalistaLayout', () => {
  let component: AnalistaLayout;
  let fixture: ComponentFixture<AnalistaLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalistaLayout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalistaLayout);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe abrir y cerrar el menú móvil', () => {
    expect(component.menuOpen).toBe(false);
    component.toggleMenu();
    expect(component.menuOpen).toBe(true);
    component.closeMenu();
    expect(component.menuOpen).toBe(false);
  });
});
