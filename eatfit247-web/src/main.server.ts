import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-server';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(App, config);

export default bootstrap;

