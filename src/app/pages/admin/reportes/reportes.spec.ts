import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ReporteService } from '../../../core/services/reporte.service';
import { Reportes } from './reportes';

const management = {
  selectedElectionId: 1,
  selectedElectionName: 'Presidencia 2026',
  counters: { records: 2, votes: 300, regions: 1, reportedTables: 8, totalTables: 10, processedPercentage: 80 },
  regions: [{ region: 'Bogotá D.C.', votes: 300, participation: 65.5, reportedTables: 8, totalTables: 10, processedPercentage: 80 }],
  elections: [{ id: 1, name: 'Presidencia 2026', type: 'PRESIDENCIA', round: 'PRIMERA', electionDate: '2026-05-31', state: 'EN_CONTEO' }],
  lastGenerated: {},
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('Reportes', () => {
  let fixture: ComponentFixture<Reportes>;
  let component: Reportes;
  let service: { gestion: ReturnType<typeof vi.fn>; descargarResultadosPorEleccion: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      descargarResultadosPorEleccion: vi.fn().mockReturnValue(of(new HttpResponse({ body: new Blob(['x']), headers: new HttpHeaders({ 'content-disposition': 'attachment; filename="reporte.pdf"' }) }))),
    };
    await TestBed.configureTestingModule({
      imports: [Reportes],
      providers: [{ provide: ReporteService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(Reportes);
    component = fixture.componentInstance;
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('carga resumen regional calculado por backend', () => {
    fixture.detectChanges();
    expect(component.selectedElectionId).toBe(1);
    expect(component.regions[0].votes).toBe(300);
    expect(component.stats[3].value).toBe(8);
  });

  it('descarga el formato seleccionado para la elección activa', () => {
    fixture.detectChanges();
    component.download('PDF');
    expect(service.descargarResultadosPorEleccion).toHaveBeenCalledWith(1, 'PDF');
    expect(component.downloadMessage).toContain('correctamente');
  });

  it('conserva la vista previa cuando falla una actualización', () => {
    fixture.detectChanges();
    service.gestion.mockReturnValueOnce(throwError(() => ({ error: { message: 'Temporal' } })));
    component.load(true);
    expect(component.regions).toHaveLength(1);
    expect(component.error).toBe('Temporal');
  });
});
