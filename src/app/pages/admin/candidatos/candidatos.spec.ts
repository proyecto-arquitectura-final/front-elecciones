import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Candidatos } from './candidatos';
import { CandidatoService } from '../../../core/services/candidato.service';
import { CandidateManagement } from '../../../core/models/candidate.model';

const management: CandidateManagement = {
  counters: {
    total: 2,
    active: 1,
    inactive: 1,
    presidency: 1,
    senate: 0,
    chamber: 1,
    representedParties: 2,
  },
  generatedAt: '2026-07-03T00:00:00Z',
  parties: [
    { id: 1, name: 'Partido Azul', acronym: 'PA', color: '#2563EB', active: true },
    { id: 2, name: 'Partido Verde', acronym: 'PV', color: '#16A34A', active: true },
  ],
  elections: [
    {
      id: 10,
      name: 'Presidencia 2026',
      type: 'PRESIDENCIA',
      round: 'PRIMERA',
      date: '2026-05-31',
      state: 'CONFIGURADA',
    },
    {
      id: 11,
      name: 'Cámara 2026',
      type: 'CAMARA',
      round: 'NINGUNA',
      date: '2026-03-08',
      state: 'CONFIGURADA',
    },
  ],
  candidates: [
    {
      id: 1,
      name: 'María Fernández',
      vicePresidentName: 'Carlos Rojas',
      party: { id: 1, name: 'Partido Azul', acronym: 'PA', color: '#2563EB', active: true },
      election: {
        id: 10,
        name: 'Presidencia 2026',
        type: 'PRESIDENCIA',
        round: 'PRIMERA',
        date: '2026-05-31',
        state: 'CONFIGURADA',
      },
      electionType: 'PRESIDENCIA',
      active: true,
      officialResultCount: 2,
      pollResultCount: 3,
      deletable: false,
    },
    {
      id: 2,
      name: 'Ana Pérez',
      party: { id: 2, name: 'Partido Verde', acronym: 'PV', color: '#16A34A', active: true },
      election: {
        id: 11,
        name: 'Cámara 2026',
        type: 'CAMARA',
        round: 'NINGUNA',
        date: '2026-03-08',
        state: 'CONFIGURADA',
      },
      electionType: 'CAMARA',
      department: 'Antioquia',
      municipality: 'Medellín',
      active: false,
      officialResultCount: 0,
      pollResultCount: 0,
      deletable: true,
    },
  ],
};

describe('Candidatos', () => {
  let fixture: ComponentFixture<Candidatos>;
  let component: Candidatos;
  let service: {
    gestion: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      crear: vi.fn().mockReturnValue(of(management.candidates[0])),
      actualizar: vi.fn().mockReturnValue(of(management.candidates[0])),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [Candidatos],
      providers: [
        { provide: CandidatoService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Candidatos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads persisted candidates and counters', () => {
    expect(service.gestion).toHaveBeenCalledOnce();
    expect(component.management.counters.total).toBe(2);
    expect(component.filteredCandidates).toHaveLength(2);
  });

  it('filters by real election and status', () => {
    component.electionFilter = '11';
    component.statusFilter = 'INACTIVE';

    expect(component.filteredCandidates.map((candidate) => candidate.name)).toEqual(['Ana Pérez']);
  });

  it('builds request from the selected election', () => {
    component.openEditor();
    component.form.name = 'Nueva Candidata';
    component.form.partyId = 1;
    component.form.electionId = 10;
    component.form.vicePresidentName = 'Nueva Fórmula';

    component.save();

    expect(service.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nueva Candidata',
        partyId: 1,
        electionId: 10,
        electionType: 'PRESIDENCIA',
        vicePresidentName: 'Nueva Fórmula',
        department: null,
      }),
    );
  });

  it('prevents delete action when candidate has linked data', () => {
    component.requestDelete(management.candidates[0]);

    expect(component.deleteOpen).toBe(false);
    expect(component.error).toContain('resultados o encuestas');
    expect(service.eliminar).not.toHaveBeenCalled();
  });

  it('requires department for chamber candidates', () => {
    component.openEditor();
    component.form.name = 'Candidata Cámara';
    component.form.partyId = 2;
    component.form.electionId = 11;
    component.form.department = '';

    component.save();

    expect(component.fieldErrors.department).toBeTruthy();
    expect(service.crear).not.toHaveBeenCalled();
  });
});
