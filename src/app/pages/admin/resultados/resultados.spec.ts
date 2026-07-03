import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  OfficialResult,
  ResultManagement,
  ResultSummary,
} from '../../../core/models/result.model';
import { ResultadoService } from '../../../core/services/resultado.service';
import { Resultados } from './resultados';

const result: OfficialResult = {
  id: 9,
  createdAt: '2026-07-02T20:00:00Z',
  updatedAt: '2026-07-02T20:00:00Z',
  election: {
    id: 1,
    name: 'Presidencia Colombia 2026',
    type: 'PRESIDENCIA',
    round: 'PRIMERA',
    date: '2026-05-31',
    state: 'EN_CONTEO',
  },
  candidate: {
    id: 3,
    name: 'María Fernández',
    active: true,
    electionId: 1,
    party: { id: 2, name: 'Partido Azul', acronym: 'PA', color: '#2563eb' },
  },
  department: 'Antioquia',
  municipality: 'Medellín',
  votes: 140000,
  percentage: 70,
  reportedTables: 1400,
  totalTables: 1700,
  participation: 66.1,
  source: 'CARGA_MANUAL',
  importedAt: '2026-07-02T20:00:00Z',
  validationStatus: 'VALIDADO',
  validationMessage: 'Validaciones de integridad superadas',
  validatedAt: '2026-07-02T20:00:00Z',
  validatedBy: 'admin@elecciones.gov.co',
};

const summary: ResultSummary = {
  id: 4,
  electionId: 1,
  eligibleVoters: 1000000,
  totalVoters: 680000,
  validVotes: 650000,
  blankVotes: 10000,
  nullVotes: 15000,
  unmarkedVotes: 15000,
  reportedTables: 8200,
  totalTables: 10000,
  tablePercentage: 82,
  participation: 68,
  source: 'CARGA_MANUAL',
  importedAt: '2026-07-02T20:00:00Z',
};

const management: ResultManagement = {
  selectedElectionId: 1,
  counters: {
    records: 1,
    candidateVotes: 640000,
    reportedTables: 8200,
    totalTables: 10000,
    tablePercentage: 82,
    participation: 68,
    validated: 1,
    pending: 0,
    rejected: 0,
    traceabilityStatus: 'COMPLETA',
    reconciliationDifference: 0,
    reconciled: true,
    lastImportedAt: '2026-07-02T20:00:00Z',
  },
  summary,
  results: { items: [result], page: 0, size: 10, totalElements: 1, totalPages: 1 },
  elections: [result.election],
  candidates: [result.candidate],
  validationStatuses: [
    { value: 'VALIDADO', label: 'Validado' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'RECHAZADO', label: 'Rechazado' },
  ],
  departments: ['Antioquia'],
  municipalities: ['Medellín'],
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('Resultados', () => {
  let fixture: ComponentFixture<Resultados>;
  let component: Resultados;
  let service: {
    gestion: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
    guardarResumen: ReturnType<typeof vi.fn>;
    validar: ReturnType<typeof vi.fn>;
    importarCsv: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      crear: vi.fn().mockReturnValue(of(result)),
      actualizar: vi.fn().mockReturnValue(of(result)),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
      guardarResumen: vi.fn().mockReturnValue(of(summary)),
      validar: vi.fn().mockReturnValue(
        of({ validated: 1, rejected: 0, recalculatedScopes: 1 }),
      ),
      importarCsv: vi.fn().mockReturnValue(
        of({ created: 1, updated: 0, processed: 1 }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [Resultados],
      providers: [
        provideRouter([]),
        { provide: ResultadoService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Resultados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads counters, options, summary and persisted results', () => {
    expect(service.gestion).toHaveBeenCalledWith({
      electionId: null,
      status: null,
      department: '',
      municipality: '',
      search: '',
      page: 0,
      size: 10,
    });
    expect(component.counters.tablePercentage).toBe(82);
    expect(component.results).toEqual([result]);
    expect(component.summary).toEqual(summary);
    expect(component.electionFilter).toBe(1);
  });

  it('keeps previous data after a temporary refresh error', () => {
    service.gestion.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Falla temporal' } })),
    );

    component.load(false);

    expect(component.results).toEqual([result]);
    expect(component.error).toContain('datos cargados anteriormente');
  });

  it('prevents invalid table totals before calling the backend', () => {
    component.openModal();
    component.form.candidateId = 3;
    component.form.votes = 100;
    component.form.reportedTables = 11;
    component.form.totalTables = 10;
    component.form.participation = 60;

    component.save();

    expect(component.modalError).toContain('no pueden superar');
    expect(service.crear).not.toHaveBeenCalled();
  });

  it('creates a normalized request and leaves percentage calculation to backend', () => {
    component.openModal();
    component.form.candidateId = 3;
    component.form.department = '  Antioquia  ';
    component.form.municipality = '  Medellín  ';
    component.form.votes = 100;
    component.form.reportedTables = 8;
    component.form.totalTables = 10;
    component.form.participation = 65.25;
    component.form.source = '  CARGA MANUAL  ';

    component.save();

    expect(service.crear).toHaveBeenCalledWith({
      electionId: 1,
      candidateId: 3,
      department: 'Antioquia',
      municipality: 'Medellín',
      votes: 100,
      reportedTables: 8,
      totalTables: 10,
      participation: 65.25,
      source: 'CARGA MANUAL',
    });
    const request = service.crear.mock.calls[0][0];
    expect(request.percentage).toBeUndefined();
  });

  it('uses server-side pagination and filters', () => {
    component.page = 1;
    component.pageSize = 20;
    component.statusFilter = 'VALIDADO';
    component.departmentFilter = 'Antioquia';
    component.municipalityFilter = 'Medellín';
    component.search = 'maría';

    component.load(false);

    expect(service.gestion).toHaveBeenLastCalledWith({
      electionId: 1,
      status: 'VALIDADO',
      department: 'Antioquia',
      municipality: 'Medellín',
      search: 'maría',
      page: 1,
      size: 20,
    });
  });

  it('keeps archived elections in read-only mode', () => {
    component.elections = [{ ...result.election, state: 'ARCHIVADA' }];
    component.electionFilter = 1;

    component.openModal();

    expect(component.canManageSelectedElection).toBe(false);
    expect(component.modalOpen).toBe(false);
    expect(component.error).toContain('solo lectura');
  });

  it('saves the persisted election summary', () => {
    component.openSummaryModal();
    component.summaryForm.validVotes = 650000;

    component.saveSummary();

    expect(service.guardarResumen).toHaveBeenCalled();
    expect(service.guardarResumen.mock.calls[0][0].electionId).toBe(1);
  });
});
