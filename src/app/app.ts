import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppearanceService } from './core/services/appearance.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly appearance = inject(AppearanceService);
}
