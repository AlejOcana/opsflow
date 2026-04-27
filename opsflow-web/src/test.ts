// Test setup file for Vitest + Angular
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Initialize Angular testing environment
getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule],
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } }
);

// Make Vitest globals available globally
globalThis.vi = globalThis.vitest || globalThis.vi;