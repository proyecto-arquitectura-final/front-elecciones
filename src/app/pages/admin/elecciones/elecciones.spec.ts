import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Elecciones } from './elecciones';
import { EleccionService } from '../../../core/services/eleccion.service';
import { ElectionManagement } from '../../../core/models/election.model';

const management: ElectionManagement = {
  counters: {
    total: 2,
    configured: 1,
    open: 0,
    counting: 1,
    closed: 0,
    archived: 0,
    withSummary: 1,
    withoutSummary: 1,
  },
  generatedAt: '2026-07-03T00:00:00Z',
  elections: [
    {
      id: 1,
      name: 'Presidencia Colombia 2026 - Primera vuelta',
      type: 'PRESIDENCIA',
      round: 'PRIMERA',
      electionDate: '2026-05-31',
      state: 'EN_CONTEO',
      reportedTables: 8200,
      totalTables: 10000,
      progress: 82,
      summaryAvailable: true,
      candidateCount: 4,
      officialResultCount: 32,
      assistantSessionCount: 2,
      structureLocked: true,
      deletable: false,
      allowedStates: ['CERRADA'],
    },
    {
      id: 2,
      name: 'Senado Colombia 2030',
      type: 'SENADO',
      round: 'NINGUNA',
      electionDate: '2030-03-10',
      state: 'CONFIGURADA',
      reportedTables: 0,
      totalTables: 0,
      progress: null,
      summaryAvailable: false,
      candidateCount: 0,
      officialResultCount: 0,
      assistantSessionCount: 0,
      structureLocked: false,
      deletable: true,
      allowedStates: ['ABIERTA', 'ARCHIVADA'],
    },
  ],
};

describe('Elecciones', () => {
  let fixture: ComponentFixture<Elecciones>;
  let component: Elecciones;
  let service: {
    gestion: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      crear: vi.fn().mockReturnValue(of(management.elections[1])),
      actualizar: vi.fn().mockReturnValue(of(management.elections[0])),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [Elecciones],
      providers: [
        { provide: EleccionService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Elecciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads persisted elections and counters from management endpoint', () => {
    expect(service.gestion).toHaveBeenCalledOnce();
    expect(component.management.counters.total).toBe(2);
    expect(component.activeCount).toBe(1);
    expect(component.filteredElections).toHaveLength(2);
  });

  it('filters by state and summary availability', () => {
    component.stateFilter = 'CONFIGURADA';
    component.summaryFilter = 'WITHOUT';

    expect(component.filteredElections.map((election) => election.id)).toEqual([2]);
  });

  it('creates a configured presidential election with normalized values', () => {
    component.openEditor();
    component.form.name = '  Presidencia   Colombia 2030 ';
    component.form.type = 'PRESIDENCIA';
    component.form.round = 'PRIMERA';
    component.form.electionDate = '2030-05-26';

    component.save();

    expect(service.crear).toHaveBeenCalledWith({
      name: 'Presidencia Colombia 2030',
      type: 'PRESIDENCIA',
      round: 'PRIMERA',
      electionDate: '2030-05-26',
      state: 'CONFIGURADA',
    });
  });

  it('locks structural fields when election has linked information', () => {
    component.openEditor(management.elections[0]);

    expect(component.structuralFieldsDisabled).toBe(true);
    expect(component.stateOptions).toEqual(['EN_CONTEO', 'CERRADA']);
  });

  it('prevents delete dialog when election is not deletable', () => {
    component.requestDelete(management.elections[0]);

    expect(component.deleteOpen).toBe(false);
    expect(component.error).toContain('no puede eliminarse');
    expect(service.eliminar).not.toHaveBeenCalled();
  });

  it('opens and confirms deletion for an empty configured election', () => {
    component.requestDelete(management.elections[1]);
    expect(component.deleteOpen).toBe(true);

    component.confirmDelete();

    expect(service.eliminar).toHaveBeenCalledWith(2);
  });

  it('preserves loaded data when a refresh fails', () => {
    service.gestion.mockReturnValueOnce(throwError(() => ({ error: { message: 'Temporal' } })));

    component.load(false);

    expect(component.management.elections).toHaveLength(2);
    expect(component.error).toBe('Temporal');
  });
});
