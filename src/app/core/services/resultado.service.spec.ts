import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ResultManagement } from '../models/result.model';
import { ResultadoService } from './resultado.service';

const management: ResultManagement = {
  selectedElectionId: 1,
  counters: {
    records: 1,
    candidateVotes: 500,
    reportedTables: 5,
    totalTables: 10,
    tablePercentage: 50,
    participation: 62.5,
    validated: 1,
    pending: 0,
    rejected: 0,
    traceabilityStatus: 'COMPLETA',
    reconciliationDifference: 0,
    reconciled: true,
    lastImportedAt: '2026-07-03T00:00:00Z',
  },
  summary: null,
  results: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
  elections: [],
  candidates: [],
  validationStatuses: [
    { value: 'VALIDADO', label: 'Validado' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'RECHAZADO', label: 'Rechazado' },
  ],
  departments: [],
  municipalities: [],
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('ResultadoService', () => {
  let service: ResultadoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResultadoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests management data with all server-side filters', () => {
    service
      .gestion({
        electionId: 4,
        status: 'VALIDADO',
        department: 'Antioquia',
        municipality: 'Medellín',
        search: 'candidato',
        page: 2,
        size: 20,
      })
      .subscribe((response) => expect(response).toEqual(management));

    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiUrl}/resultados/gestion`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('electionId')).toBe('4');
    expect(request.request.params.get('status')).toBe('VALIDADO');
    expect(request.request.params.get('department')).toBe('Antioquia');
    expect(request.request.params.get('municipality')).toBe('Medellín');
    expect(request.request.params.get('search')).toBe('candidato');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('20');
    request.flush({ success: true, message: 'OK', data: management });
  });

  it('uploads CSV as multipart data', () => {
    const file = new File(['header\n'], 'resultados.csv', { type: 'text/csv' });

    service.importarCsv(file).subscribe((response) => {
      expect(response).toEqual({ created: 2, updated: 1, processed: 3 });
    });

    const request = http.expectOne(`${environment.apiUrl}/resultados/import-csv`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect(((request.request.body as FormData).get('file') as File).name).toBe('resultados.csv');
    request.flush({
      success: true,
      message: 'OK',
      data: { created: 2, updated: 1, processed: 3 },
    });
  });

  it('sends election id when validating persisted results', () => {
    service.validar(9).subscribe((response) => expect(response.validated).toBe(4));

    const request = http.expectOne(
      (candidate) => candidate.url === `${environment.apiUrl}/resultados/validar`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.params.get('electionId')).toBe('9');
    request.flush({
      success: true,
      message: 'OK',
      data: { validated: 4, rejected: 0, recalculatedScopes: 2 },
    });
  });
});
