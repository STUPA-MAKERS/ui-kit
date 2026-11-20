import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { ShowcaseComponent } from './app/showcase.component';
import { SHOWCASE_ROUTES } from './app/pages';

bootstrapApplication(ShowcaseComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(SHOWCASE_ROUTES, withComponentInputBinding()),
  ],
}).catch((error: unknown) => console.error(error));
