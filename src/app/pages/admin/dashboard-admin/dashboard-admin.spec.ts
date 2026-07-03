import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardAdmin } from './dashboard-admin';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { AdminDashboardData } from '../../../core/models/admin-dashboard.model';

describe('DashboardAdmin', () => {
  let component: DashboardAdmin;
  let fixture: ComponentFixture<DashboardAdmin>;

  const response: AdminDashboardData = {
    counters: {
      activeElections: 1,
      candidates: 4,
      polls: 5,
      users: 2,
      parties: 4,
      auditEvents: 3,
      resultRecords: 32,
    },
    elections: [
      {
        id: 1,
        name: 'Presidencia Colombia 2026 - Primera vuelta',
        type: 'PRESIDENCIA',
        date: '2026-05-31',
        state: 'EN_CONTEO',
        reportedTables: 8200,
        totalTables: 10000,
        progress: 82,
        summaryAvailable: true,
      },
    ],
    recentActivity: [
      {
        id: 1,
        title: 'Resultados importados',
        detail: 'Se cargaron resultados electorales.',
        actor: 'sistema',
        success: true,
        at: new Date().toISOString(),
      },
    ],
    systemStatus: [
      {
        code: 'DATABASE',
        status: 'Operativa',
        detail: '48 registros principales disponibles.',
        level: 'SUCCESS',
      },
    ],
    generatedAt: '2026-07-03T00:00:00Z',
  };

  const dashboardService = {
    obtener: vi.fn(() => of(response)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    dashboardService.obtener.mockReturnValue(of(response));

    await TestBed.configureTestingModule({
      imports: [DashboardAdmin],
      providers: [
        provideRouter([]),
        { provide: AdminDashboardService, useValue: dashboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAdmin);
    component = fixture.componentInstance;
  });

  afterEach(() => component.ngOnDestroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga el resumen administrativo desde un solo endpoint', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dashboardService.obtener).toHaveBeenCalledTimes(1);
    expect(component.stats.map((item) => item.value)).toEqual(['1', '4', '5', '2']);
    expect(component.elecciones).toHaveLength(1);
    expect(component.actividad).toHaveLength(1);
    expect(component.ultimaActualizacion).not.toBeNull();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Presidencia Colombia 2026 - Primera vuelta');
    expect(text).toContain('82%');
    expect(text).toContain('Estado general del sistema');
    expect(text).not.toContain('API Registraduría');
  });

  it('conserva los datos anteriores cuando una actualización falla', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    dashboardService.obtener.mockReturnValueOnce(
      throwError(() => ({ status: 0, message: 'Network error' })),
    );

    component.cargar();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    fixture.detectChanges();

    expect(component.elecciones).toHaveLength(1);
    expect(component.advertencia).toContain('Se conserva la última información disponible');
    expect(component.error).toBe('');
  });
});
