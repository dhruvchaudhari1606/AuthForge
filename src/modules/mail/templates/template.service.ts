import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { registerTemplateHelpers } from './template.helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mjml2html = require('mjml') as (input: string) => { html: string };

@Injectable()
export class TemplateService {
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    registerTemplateHelpers();
  }

  render(template: string, context: Record<string, any>): string {
    const compiled = this.getTemplate(template);

    const mjml: string = compiled(context);

    const result = mjml2html(mjml);

    return result.html;
  }

  private getTemplate(template: string): Handlebars.TemplateDelegate {
    if (this.templateCache.has(template)) {
      return this.templateCache.get(template)!;
    }

    const templatePath = path.join(
      process.cwd(),
      'src/templates/email',
      `${template}.mjml.hbs`,
    );

    const source = fs.readFileSync(templatePath, 'utf8');

    const compiled = Handlebars.compile(source);

    this.templateCache.set(template, compiled);

    return compiled;
  }
}
