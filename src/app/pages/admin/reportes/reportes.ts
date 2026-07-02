import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../core/services/reporte.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { OfficialResult } from '../../../core/models/result.model';

@Component({ selector: 'app-reportes', standalone: true, imports: [CommonModule], templateUrl: './reportes.html', styleUrl: './reportes.scss' })
export class Reportes implements OnInit {
  resultados: OfficialResult[]=[];
  constructor(private readonly reporteService: ReporteService, private readonly resultadoService: ResultadoService) {}
  ngOnInit(): void { this.resultadoService.listar().subscribe(d=>this.resultados=d); }
  get votosTotales(){return this.resultados.reduce((s,r)=>s+(r.votes||0),0);} get regiones(){return [...new Set(this.resultados.map(r=>r.department||'Sin región'))].length;}
  stats=[{label:'Reportes Generados',value:'Real',sub:'Desde backend',icon:'📄',iconClass:'icon-blue'},{label:'Formato PDF',value:'PDF',sub:'OpenPDF backend',icon:'📕',iconClass:'icon-red'},{label:'CSV Exportados',value:'CSV',sub:'Datos tabulados',icon:'📗',iconClass:'icon-green'},{label:'JSON Generados',value:'JSON',sub:'Integraciones/API',icon:'📘',iconClass:'icon-purple'}];
  reportes=[{icon:'🗳',iconClass:'icon-blue',titulo:'Reporte de Resultados Consolidados',descripcion:'Resultados completos por elección, candidato y territorio',formatos:['PDF','CSV','JSON'],ultimoGenerado:'Disponible en línea'}];
  get regionData(){ const map=new Map<string,{region:string,votos:number,participacion:number,mesas:number,procesado:number}>(); for(const r of this.resultados){ const key=r.department||'Sin región'; const item=map.get(key)||{region:key,votos:0,participacion:0,mesas:0,procesado:0}; item.votos+=r.votes||0; item.participacion=Math.max(item.participacion,r.participation||0); item.mesas+=r.reportedTables||0; item.procesado=r.totalTables?Math.round((r.reportedTables||0)*100/(r.totalTables||1)):item.procesado; map.set(key,item);} return [...map.values()]; }
  exportOpciones=[{icon:'📕',iconClass:'icon-red',titulo:'Exportar PDF',sub:'Reporte formateado con tabla',btnLabel:'Generar PDF',format:'pdf' as const},{icon:'📗',iconClass:'icon-green',titulo:'Exportar CSV',sub:'Datos tabulados para Excel',btnLabel:'Descargar CSV',format:'csv' as const},{icon:'📘',iconClass:'icon-purple',titulo:'Exportar JSON',sub:'API/Integración de datos',btnLabel:'Obtener JSON',format:'json' as const}];
  descargar(format:'pdf'|'csv'|'json'){ this.reporteService.descargarResultados(format); }
}
