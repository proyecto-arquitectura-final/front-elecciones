import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncuestaService } from '../../../core/services/encuesta.service';
import { CandidatoService } from '../../../core/services/candidato.service';
import { Poll } from '../../../core/models/poll.model';
import { Candidate } from '../../../core/models/candidate.model';

@Component({ selector: 'app-encuestas', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './encuestas.html', styleUrl: './encuestas.scss' })
export class Encuestas implements OnInit {
  busqueda=''; modalAbierto=false; modoEdicion=false; error=''; form:any=this.formVacio(); encuestas:Poll[]=[]; candidatos:Candidate[]=[];
  constructor(private readonly encuestaService: EncuestaService, private readonly candidatoService: CandidatoService) {}
  ngOnInit(): void { this.cargar(); this.cargarCandidatos(); }
  cargar(): void { this.encuestaService.listar().subscribe({next:d=>this.encuestas=d,error:e=>{this.error='No se pudieron cargar las encuestas';console.error(e);}}); }
  cargarCandidatos(): void { this.candidatoService.listar().subscribe({next:d=>this.candidatos=d,error:e=>console.error(e)}); }
  get encuestasFiltradas(){ const b=this.busqueda.toLowerCase(); return this.encuestas.filter(e=>!b||e.source.toLowerCase().includes(b)); }
  get aprobadas(){ return this.encuestas.length; } get pendientes(){ return 0; } get pctAprobadas(){ return this.encuestas.length?100:0; } get muestraPromedio(){ return this.encuestas.length?Math.round(this.encuestas.reduce((s,e)=>s+(e.sampleSize||0),0)/this.encuestas.length):0; }
  get intencionVoto(){ const ultima=this.encuestas[0]; return (ultima?.results||[]).map((r,i)=>({nombre:r.candidate?.name||`Candidato ${i+1}`, pct:r.percentage||0, colorClass:['blue','red','green','orange'][i%4]})); }
  get detallesMetod(){ const e=this.encuestas[0]; return e?[{label:'Fuente',value:e.source},{label:'Fecha de Realización',value:e.date},{label:'Tamaño de Muestra',value:`${e.sampleSize} personas`},{label:'Margen de Error',value:`±${e.marginError}%`},{label:'Metodología',value:e.methodology},{label:'Resultados',value:`${e.results?.length||0} candidatos`}]:[]; }
  abrirModal(e?:Poll): void { this.modoEdicion=!!e; this.form=e?{id:e.id, fuente:e.source, fecha:e.date, muestra:e.sampleSize, margen:e.marginError, metodologia:e.methodology, candidateId:e.results?.[0]?.candidate?.id||'', percentage:e.results?.[0]?.percentage||0}:this.formVacio(); this.modalAbierto=true; }
  cerrarModal(): void { this.modalAbierto=false; this.error=''; }
  guardar(): void { if(!this.form.fuente||!this.form.fecha||!this.form.muestra){this.error='Completa fuente, fecha y muestra.';return;} const results=this.form.candidateId?[{candidateId:Number(this.form.candidateId),percentage:Number(this.form.percentage||0)}]:[]; const req:Poll={source:this.form.fuente,date:this.form.fecha,sampleSize:Number(this.form.muestra),marginError:Number(this.form.margen||0),methodology:this.form.metodologia,results}; const obs=this.modoEdicion&&this.form.id?this.encuestaService.actualizar(this.form.id,req):this.encuestaService.crear(req); obs.subscribe({next:()=>{this.cerrarModal();this.cargar();},error:e=>{this.error='No se pudo guardar la encuesta';console.error(e);}}); }
  eliminar(e:Poll): void { if(!e.id||!confirm(`¿Eliminar encuesta de "${e.source}"?`))return; this.encuestaService.eliminar(e.id).subscribe({next:()=>this.cargar(),error:x=>{this.error='No se pudo eliminar';console.error(x);}}); }
  private formVacio(){ return {id:null,fuente:'',fecha:'',muestra:null,margen:2,metodologia:'Telefónica',candidateId:'',percentage:0}; }
}
