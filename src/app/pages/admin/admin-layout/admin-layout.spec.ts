import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no debe mostrar una opción de configuración sin ruta', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Configuración');
    expect(text).toContain('Cerrar Sesión');
  });
});
