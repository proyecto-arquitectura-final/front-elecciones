import { TestBed } from '@angular/core/testing';

import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('native-platform', 'web-platform');
    TestBed.configureTestingModule({});
  });

  it('debe marcar el navegador como plataforma web', () => {
    const service = TestBed.inject(PlatformService);

    expect(service.isNative()).toBe(false);
    expect(document.documentElement.classList.contains('web-platform')).toBe(true);
    expect(document.documentElement.dataset['platform']).toBe('web');
  });
});
