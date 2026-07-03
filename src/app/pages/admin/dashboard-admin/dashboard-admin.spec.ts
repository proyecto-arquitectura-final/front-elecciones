import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardAdmin } from './dashboard-admin';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { UsuarioService } from '../../../core/services/usuario.service';

describe('DashboardAdmin', () => {
  let component: DashboardAdmin;
  let fixture: ComponentFixture<DashboardAdmin>;

  const eleccionService = {
    listar: vi.fn(() =>
      of([
        {
          id: 1,
          name: 'Elección Presidencial 2026',
          type: 'PRESIDENCIA',
          round: 'PRIMERA',
          electionDate: '2026-05-31',
          state: 'ABIERTA',
        },
      ]),
    ),
  };

  const candidatoService = {
    listar: vi.fn(() =>
      of([
        {
          id: 10,
          name: 'Candidata de prueba',
          electionType: 'PRESIDENCIA',
          active: true,
        },
      ]),
    ),
  };

  const encuestaService = {
    listar: vi.fn(() =>
      of([
        {
          id: 20,
          source: 'Prueba',
          date: '2026-01-10',
          sampleSize: 1000,
          marginError: 2.5,
          methodology: 'Telefónica',
          results: [],
        },
      ]),
    ),
  };

  const auditoriaService = {
    listar: vi.fn(() => of([])),
  };

  const resultadoService = {
    listar: vi.fn(() => of([])),
    estadoRegistraduria: vi.fn(() => of('DATABASE_WITH_DATA')),
  };

  const usuarioService = {
    listar: vi.fn(() =>
      of([
        {
          id: 30,
          name: 'Administrador',
          email: 'admin@elecciones.gov.co',
          role: 'ADMINISTRADOR',
          active: true,
        },
      ]),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DashboardAdmin],
      providers: [
        provideRouter([]),
        { provide: EleccionService, useValue: eleccionService },
        { provide: CandidatoService, useValue: candidatoService },
        { provide: EncuestaService, useValue: encuestaService },
        { provide: AuditoriaService, useValue: auditoriaService },
        { provide: ResultadoService, useValue: resultadoService },
        { provide: UsuarioService, useValue: usuarioService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAdmin);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe finalizar la primera carga y mostrar los datos recibidos', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.cargando).toBe(false);
    expect(component.stats.map((item) => item.value)).toEqual(['1', '1', '1', '1']);
    expect(component.elecciones).toHaveLength(1);
    expect(component.ultimaActualizacion).not.toBeNull();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Cargando información del sistema');
    expect(text).toContain('Elección Presidencial 2026');
    expect(text).toContain('Actualizar');
  });
});
