import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { AppearanceService } from './core/services/appearance.service';
import { PlatformService } from './core/services/platform.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly appearance = inject(AppearanceService);
  readonly platform = inject(PlatformService);
  readonly apkDownloadUrl = environment.apkDownloadUrl;

  constructor() {
    void this.platform.initialize();
    effect(() => {
      void this.platform.syncStatusBar(this.appearance.isDark());
    });
  }
}
