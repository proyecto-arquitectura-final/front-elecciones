import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;
  constructor(private readonly http: HttpClient) {}

  descargarResultados(format: 'pdf' | 'csv' | 'json'): void {
    const url = `${this.apiUrl}/resultados?format=${format}`;

    if (format === 'json') {
      this.http.get<unknown>(url).subscribe(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.download(blob, 'resultados.json');
      });
      return;
    }

    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      this.download(blob, `resultados.${format}`);
    });
  }

  private download(blob: Blob, filename: string): void {
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }
}
