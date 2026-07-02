import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrediccionService } from '../../../core/services/prediccion.service';
import { PredictionItem } from '../../../core/models/result.model';

@Component({ selector: 'app-predicciones-analista', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './predicciones-analista.html', styleUrl: './predicciones-analista.scss' })
export class PrediccionesAnalista implements OnInit {
  tab:'vivo'|'encuestas'='vivo'; proyecciones:any[]=[]; promedioEncuestas:any[]=[]; error='';
  metodologia=[{icon:'🗃',iconClass:'icon-blue',titulo:'Resultados Parciales',descripcion:'Proyección basada en votos oficiales cargados'},{icon:'📊',iconClass:'icon-purple',titulo:'Encuestas',descripcion:'Promedio ponderado por recencia y tamaño de muestra'},{icon:'📈',iconClass:'icon-green',titulo:'Transparencia',descripcion:'Predicción ≠ resultado oficial'},{icon:'↗️',iconClass:'icon-orange',titulo:'Incertidumbre',descripcion:'Margen estimado entregado por el modelo'}];
  constructor(private readonly prediccionService: PrediccionService) {}
  ngOnInit(): void { this.cargar(); }
  cargar(): void { this.prediccionService.porResultadosParciales().subscribe({next:d=>this.proyecciones=this.mapPred(d), error:e=>{this.error='No se pudieron cargar predicciones por resultados';console.error(e);}}); this.prediccionService.porEncuestas().subscribe({next:d=>this.promedioEncuestas=this.mapPoll(d), error:e=>console.error(e)}); }
  private mapPred(data:PredictionItem[]){ return data.map(p=>({nombre:p.candidate, actual:this.round(p.currentPercentage), proyectado:this.round(p.projectedPercentage), probabilidad:this.round(p.probability), colorClass:p.probability>=50?'prob-green':'prob-gray'})); }
  private mapPoll(data:PredictionItem[]){ return data.map((p,i)=>({nombre:p.candidate,promedio:this.round(p.projectedPercentage),colorClass:['blue','red','green','orange'][i%4]})); }
  private round(n:number){ return Math.round((n||0)*10)/10; }
}
