import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../../core/utils/zoneless-view.util';
import { FormsModule } from '@angular/forms';
import { PredictionItem } from '../../../core/models/result.model';
import { PrediccionService } from '../../../core/services/prediccion.service';

interface PredictionView {
  nombre: string;
  actual: number;
  proyectado: number;
  probabilidad: number;
  incertidumbre: number;
  colorClass: 'prob-green' | 'prob-gray';
}

interface PollAverageView {
  nombre: string;
  promedio: number;
  colorClass: string;
}

@Component({
  selector: 'app-predicciones-analista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predicciones-analista.html',
  styleUrl: './predicciones-analista.scss',
})
export class PrediccionesAnalista implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  tab: 'vivo' | 'encuestas' = 'vivo';
  proyecciones: PredictionView[] = [];
  promedioEncuestas: PollAverageView[] = [];
  error = '';

  metodologia = [
    {
      icon: '🗃',
      iconClass: 'icon-blue',
      titulo: 'Resultados Parciales',
      descripcion: 'Proyección basada en votos oficiales cargados',
    },
    {
      icon: '📊',
      iconClass: 'icon-purple',
      titulo: 'Encuestas',
      descripcion: 'Promedio ponderado por recencia y tamaño de muestra',
    },
    {
      icon: '📈',
      iconClass: 'icon-green',
      titulo: 'Transparencia',
      descripcion: 'Predicción ≠ resultado oficial',
    },
    {
      icon: '↗️',
      iconClass: 'icon-orange',
      titulo: 'Incertidumbre',
      descripcion: 'Margen estimado entregado por el modelo',
    },
  ];

  constructor(private readonly prediccionService: PrediccionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get mayorProbabilidad(): number {
    return this.proyecciones.length
      ? Math.max(...this.proyecciones.map((item) => item.probabilidad))
      : 0;
  }

  get incertidumbrePromedio(): number {
    if (!this.proyecciones.length) {
      return 0;
    }

    const total = this.proyecciones.reduce((sum, item) => sum + item.incertidumbre, 0);
    return this.round(total / this.proyecciones.length);
  }

  cargar(): void {
    this.error = '';

    this.prediccionService
      .porResultadosParciales()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.proyecciones = this.mapPred(data);
        },
        error: (error) => {
          this.error = 'No se pudieron cargar las predicciones por resultados parciales.';
          console.error(error);
        },
      });

    this.prediccionService
      .porEncuestas()
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (data) => {
          this.promedioEncuestas = this.mapPoll(data);
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  private mapPred(data: PredictionItem[]): PredictionView[] {
    return data.map((item) => ({
      nombre: item.candidate,
      actual: this.round(item.currentPercentage),
      proyectado: this.round(item.projectedPercentage),
      probabilidad: this.round(item.probability),
      incertidumbre: this.round(item.uncertaintyMargin),
      colorClass: item.probability >= 50 ? 'prob-green' : 'prob-gray',
    }));
  }

  private mapPoll(data: PredictionItem[]): PollAverageView[] {
    return data.map((item, index) => ({
      nombre: item.candidate,
      promedio: this.round(item.projectedPercentage),
      colorClass: ['blue', 'red', 'green', 'orange'][index % 4],
    }));
  }

  private round(value: number): number {
    return Math.round((value || 0) * 10) / 10;
  }
}
