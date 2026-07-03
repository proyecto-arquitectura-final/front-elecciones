import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { DashboardPublic } from './dashboard-public';

describe('DashboardPublic', () => {
  let component: DashboardPublic;
  let fixture: ComponentFixture<DashboardPublic>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPublic],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPublic);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders only persisted result values and the data quality state', async () => {
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/public/dashboard');
    request.flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: {
        election: {
          id: 9,
          name: 'Elección persistida',
          type: 'PRESIDENCIA',
          round: 'PRIMERA',
          date: '2026-05-31',
          state: 'EN_CONTEO',
        },
        elections: [
          {
            id: 9,
            name: 'Elección persistida',
            type: 'PRESIDENCIA',
            round: 'PRIMERA',
            date: '2026-05-31',
            state: 'EN_CONTEO',
          },
        ],
        summary: {
          candidateVotes: 1234,
          voters: 1400,
          eligibleVoters: 2000,
          validVotes: 1300,
          blankVotes: 66,
          nullVotes: 70,
          unmarkedVotes: 30,
          reportedTables: 12,
          totalTables: 20,
          percentageTables: 60,
          participation: 70,
          departments: 1,
          municipalities: 1,
          resultRecords: 2,
          consistencyDifference: 0,
          consistent: true,
          source: 'FUENTE_PRUEBA',
          lastUpdated: '2026-07-02T00:00:00Z',
        },
        candidates: [
          {
            rank: 1,
            id: 1,
            candidate: 'Candidata persistida',
            party: 'Partido persistido',
            acronym: 'PP',
            color: '#123456',
            votes: 700,
            percentage: 53.8,
            gapVotes: 0,
            gapPercentage: 0,
          },
          {
            rank: 2,
            id: 2,
            candidate: 'Candidato dos',
            party: 'Partido dos',
            acronym: 'PD',
            color: '#654321',
            votes: 534,
            percentage: 41.1,
            gapVotes: 166,
            gapPercentage: 12.7,
          },
        ],
        territories: [
          {
            level: 'DEPARTAMENTO',
            department: 'Antioquia',
            reportedTables: 12,
            totalTables: 20,
            processedPercentage: 60,
            participation: 70,
            leader: 'Candidata persistida',
            votes: 1234,
          },
        ],
      },
    });

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Elección persistida');
    expect(text).toContain('Candidata persistida');
    expect(text).toContain('1,234');
    expect(text).toContain('FUENTE_PRUEBA');
    expect(text).toContain('Consolidado consistente');
    expect(text).toContain('Predicciones');
    expect(text).toContain('Asistente');

    const responsiveTables = fixture.nativeElement.querySelectorAll('table[data-responsive="cards"]');
    expect(responsiveTables.length).toBe(2);
    expect(responsiveTables[0].querySelector('td[data-label="Candidato"]')).toBeTruthy();
    expect(responsiveTables[1].querySelector('td[data-label="Territorio"]')).toBeTruthy();
  });

  it('refreshes the selected election without clearing the current screen', async () => {
    fixture.detectChanges();
    http.expectOne('/api/v1/public/dashboard').flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:00:00Z',
      data: emptyResponse(9),
    });
    await fixture.whenStable();
    fixture.detectChanges();

    component.refrescar();
    const refresh = http.expectOne('/api/v1/public/dashboard?electionId=9');
    expect(component.actualizando).toBe(true);
    refresh.flush({
      success: true,
      message: 'OK',
      timestamp: '2026-07-02T00:01:00Z',
      data: emptyResponse(9),
    });
    await fixture.whenStable();

    expect(component.actualizando).toBe(false);
    expect(component.cargando).toBe(false);
  });
});

function emptyResponse(id: number) {
  return {
    election: {
      id,
      name: 'Elección',
      type: 'PRESIDENCIA',
      round: 'PRIMERA',
      date: '2026-05-31',
      state: 'EN_CONTEO',
    },
    elections: [],
    summary: {
      candidateVotes: 0,
      voters: 0,
      eligibleVoters: 0,
      validVotes: 0,
      blankVotes: 0,
      nullVotes: 0,
      unmarkedVotes: 0,
      reportedTables: 0,
      totalTables: 0,
      percentageTables: 0,
      participation: 0,
      departments: 0,
      municipalities: 0,
      resultRecords: 0,
      consistencyDifference: 0,
      consistent: true,
      source: 'SIN_DATOS',
    },
    candidates: [],
    territories: [],
  };
}
