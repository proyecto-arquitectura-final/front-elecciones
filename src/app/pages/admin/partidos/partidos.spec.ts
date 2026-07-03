import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Partidos } from './partidos';
import { PartidoService } from '../../../core/services/partido.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { Party } from '../../../core/models/party.model';
import { Candidate } from '../../../core/models/candidate.model';

const parties: Party[] = [
  {
    id: 1,
    name: 'Pacto Cívico Colombiano',
    acronym: 'PCC',
    color: '#2563EB',
    foundationYear: 2012,
    active: true,
  },
  {
    id: 2,
    name: 'Alianza Nacional',
    acronym: 'AN',
    color: '#DC2626',
    foundationYear: 2008,
    active: true,
  },
];

const candidates: Candidate[] = [
  {
    id: 1,
    name: 'María Fernández',
    partyId: 1,
    electionType: 'PRESIDENCIA',
    active: true,
  },
  {
    id: 2,
    name: 'Juan Rodríguez',
    party: parties[1],
    electionType: 'PRESIDENCIA',
    active: true,
  },
];

describe('Partidos', () => {
  let component: Partidos;
  let fixture: ComponentFixture<Partidos>;
  let partyService: { listar: ReturnType<typeof vi.fn>; crear: ReturnType<typeof vi.fn>; actualizar: ReturnType<typeof vi.fn>; eliminar: ReturnType<typeof vi.fn> };
  let candidateService: { listar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    partyService = {
      listar: vi.fn().mockReturnValue(of(parties)),
      crear: vi.fn().mockReturnValue(of(parties[0])),
      actualizar: vi.fn().mockReturnValue(of(parties[0])),
      eliminar: vi.fn().mockReturnValue(of(void 0)),
    };
    candidateService = {
      listar: vi.fn().mockReturnValue(of(candidates)),
    };

    await TestBed.configureTestingModule({
      imports: [Partidos],
      providers: [
        provideRouter([]),
        { provide: PartidoService, useValue: partyService },
        { provide: CandidatoService, useValue: candidateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Partidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calcula los candidatos de cada partido desde el servicio de candidatos', () => {
    expect(component.totalCandidatos).toBe(2);
    expect(component.partidos.find((party) => party.id === 1)?.candidatos).toBe(1);
    expect(component.partidos.find((party) => party.id === 2)?.candidatos).toBe(1);
  });

  it('presenta estadísticas derivadas de la información persistida', () => {
    const stats = component.stats;
    expect(stats[0].value).toBe('2');
    expect(stats[1].value).toBe('2');
    expect(stats[2].value).toBe('2');
    expect(stats[3].value).toBe('0');
  });

  it('permite seleccionar un color desde la paleta', () => {
    component.seleccionarColor('#16A34A');
    expect(component.form.color).toBe('#16A34A');
    expect(component.esColorSeleccionado('#16a34a')).toBe(true);
  });

  it('no expone un campo de texto para escribir colores manualmente', () => {
    const colorTextInput = fixture.nativeElement.querySelector('input.color-text');
    expect(colorTextInput).toBeNull();
  });
});
