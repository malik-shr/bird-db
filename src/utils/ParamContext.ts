import type { SQLParams, SQLValue } from './types';

export class ParameterContext {
  private params: SQLParams = {};
  private paramIndex = 0;

  addParameter(value: SQLValue) {
    const paramStr = `$${this.paramIndex}`;

    this.params[paramStr] = value;
    ++this.paramIndex;

    return paramStr;
  }

  getParameters(): SQLParams {
    return this.params;
  }
}
