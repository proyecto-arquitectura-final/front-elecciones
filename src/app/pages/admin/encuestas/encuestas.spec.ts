import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { Poll, PollManagement } from '../../../core/models/poll.model';
import { Encuestas } from './encuestas';

const poll: Poll = {
  id: 5,
  createdAt: '2026-05-28T12:00:00Z',
  updatedAt: '2026-05-28T12:00:00Z',
  election: {
    id: 1,
    name: 'Presidencia Colombia 2026',
    type: 'PRESIDENCIA',
    round: 'PRIMERA',
    date: '2026-05-31',
    state: 'CONFIGURADA',
  },
  source: 'Centro de Estudios Electorales',
  date: '2026-05-28',
  sampleSize: 2500,
  marginError: 2,
  methodology: 'Mixta con cobertura urbana y rural',
  status: 'APROBADA',
  totalPercentage: 100,
  results: [
    {
      id: 20,
      candidate: {
        id: 10,
        name: 'María Fernández',
        active: true,
        electionId: 1,
        party: { id: 2, name: 'Partido Azul', acronym: 'PA', color: '#2563eb' },
      },
      percentage: 57.5,
    },
    {
      id: 21,
      candidate: {
        id: 11,
        name: 'Juan Rodríguez',
        active: true,
        electionId: 1,
        party: { id: 3, name: 'Partido Verde', acronym: 'PV', color: '#16a34a' },
      },
      percentage: 42.5,
    },
  ],
};

const management: PollManagement = {
  counters: { total: 5, approved: 4, pending: 1, rejected: 0, averageSample: 2020 },
  polls: { items: [poll], page: 0, size: 10, totalElements: 1, totalPages: 1 },
  elections: [poll.election],
  candidates: poll.results.map((result) => result.candidate),
  generatedAt: '2026-07-03T00:00:00Z',
};

describe('Encuestas', () => {
  let fixture: ComponentFixture<Encuestas>;
  let component: Encuestas;
  let service: {
    gestion: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
    importarCsv: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      gestion: vi.fn().mockReturnValue(of(management)),
      crear: vi.fn().mockReturnValue(of(poll)),
      actualizar: vi.fn().mockReturnValue(of(poll)),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
      importarCsv: vi.fn().mockReturnValue(of({ polls: 1, results: 2 })),
    };

    await TestBed.configureTestingModule({
      imports: [Encuestas],
      providers: [
        { provide: EncuestaService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Encuestas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads counters, options and persisted polls from the management endpoint', () => {
    expect(service.gestion).toHaveBeenCalledWith({
      electionId: null,
      status: null,
      search: '',
      page: 0,
      size: 10,
    });
    expect(component.counters.total).toBe(5);
    expect(component.polls).toEqual([poll]);
    expect(component.selectedPoll?.id).toBe(5);
    expect(component.voteBars[0].name).toBe('María Fernández');
  });

  it('keeps previously loaded data when a refresh fails', () => {
    service.gestion.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Falla temporal' } })),
    );

    component.load(false);

    expect(component.polls).toEqual([poll]);
    expect(component.error).toContain('datos cargados anteriormente');
  });

  it('opens the editor with all persisted results', () => {
    component.openModal(poll);

    expect(component.editMode).toBe(true);
    expect(component.form.electionId).toBe(1);
    expect(component.form.results).toEqual([
      { candidateId: 10, percentage: 57.5 },
      { candidateId: 11, percentage: 42.5 },
    ]);
  });

  it('prevents duplicate candidates before calling the backend', () => {
    component.openModal();
    component.form.source = 'Firma electoral';
    component.form.date = '2026-05-20';
    component.form.sampleSize = 1200;
    component.form.marginError = 2.5;
    component.form.methodology = 'Muestreo estratificado';
    component.form.results = [
      { candidateId: 10, percentage: 40 },
      { candidateId: 10, percentage: 35 },
    ];

    component.save();

    expect(component.modalError).toContain('mismo candidato');
    expect(service.crear).not.toHaveBeenCalled();
  });

  it('creates a normalized request with election, status and results', () => {
    component.openModal();
    component.form.source = '  Firma   Electoral  ';
    component.form.date = '2026-05-20';
    component.form.sampleSize = 1200;
    component.form.marginError = 2.5;
    component.form.methodology = '  Muestreo estratificado  ';
    component.form.status = 'PENDIENTE';
    component.form.results = [{ candidateId: 10, percentage: 40 }];

    component.save();

    expect(service.crear).toHaveBeenCalledWith({
      electionId: 1,
      source: 'Firma   Electoral',
      date: '2026-05-20',
      sampleSize: 1200,
      marginError: 2.5,
      methodology: 'Muestreo estratificado',
      status: 'PENDIENTE',
      results: [{ candidateId: 10, percentage: 40 }],
    });
    expect(component.message).toBe('Encuesta creada correctamente.');
  });

  it('uses server-side pagination parameters', () => {
    component.page = 1;
    component.pageSize = 20;
    component.electionFilter = 1;
    component.statusFilter = 'APROBADA';
    component.search = 'centro';

    component.load(false);

    expect(service.gestion).toHaveBeenLastCalledWith({
      electionId: 1,
      status: 'APROBADA',
      search: 'centro',
      page: 1,
      size: 20,
    });
  });
  it('keeps text and select controls interactive inside the mobile editor', () => {
    component.openModal();
    fixture.detectChanges();

    const source = fixture.nativeElement.querySelector('#poll-source') as HTMLInputElement;
    source.value = 'Firma móvil';
    source.dispatchEvent(new Event('input', { bubbles: true }));

    const status = fixture.nativeElement.querySelector('#poll-status') as HTMLSelectElement;
    status.selectedIndex = 1;
    status.dispatchEvent(new Event('change', { bubbles: true }));

    fixture.detectChanges();

    expect(component.form.source).toBe('Firma móvil');
    expect(component.form.status).toBe('APROBADA');
    expect(source.disabled).toBe(false);
    expect(status.disabled).toBe(false);
  });

  it('does not close the editor when the dialog itself receives a click', () => {
    component.openModal();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.poll-modal') as HTMLElement;
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.modalOpen).toBe(true);
  });

});
