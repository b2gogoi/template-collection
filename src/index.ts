import {TemplateCollectionsApiApplication} from './application';
import {ApplicationConfig} from '@loopback/core';

export {TemplateCollectionsApiApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new TemplateCollectionsApiApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
