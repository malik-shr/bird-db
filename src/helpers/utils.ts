function quoteIdentifier(identifier: string): string {
  if (/^".+"$/.test(identifier)) return identifier;
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function quoteTable(input: string): string {
  const regex =
    /^\s*([a-zA-Z_][\w$]*)(?:\.([a-zA-Z_][\w$]*))?(?:\s+(?:AS\s+)?([a-zA-Z_][\w$]*))?\s*$/i;
  const match = input.match(regex);

  if (!match) {
    throw new Error(`Invalid table expression: "${input}"`);
  }

  const [, part1, part2, alias] = match;

  const schema = part2 ? part1 : null;
  const table = part2 || part1;

  if (table) {
    const quotedSchema = schema ? quoteIdentifier(schema) + '.' : '';
    const quotedTable = quoteIdentifier(table);
    const quotedAlias = alias ? ` AS ${quoteIdentifier(alias)}` : '';

    return `${quotedSchema}${quotedTable}${quotedAlias}`;
  } else {
    throw Error('No table provided');
  }
}

export function quoteColumns(expressions: string[]): string[] {
  return expressions.map((expression) => {
    return quoteColumn(expression);
  });
}

export function quoteColumn(expression: string): string {
  if (expression === '*') return '*';

  const regex =
    /^\s*([a-zA-Z_][\w$]*)(?:\.([a-zA-Z_][\w$]*))?(?:\.([a-zA-Z_][\w$]*))?(?:\s+(?:AS\s+)?([a-zA-Z_][\w$]*))?\s*$/i;
  const match = expression.match(regex);

  if (!match) {
    throw new Error(`Invalid column expression: "${expression}"`);
  }

  const [, part1, part2, part3, alias] = match;

  let schema: string | null = null;
  let table: string | null = null;
  let column: string;

  if (part1 && part2 && part3) {
    schema = part1;
    table = part2;
    column = part3;
  } else if (part1 && part2) {
    table = part1;
    column = part2;
  } else if (part1) {
    column = part1;
  } else {
    throw Error('No column provided');
  }

  const qualified =
    (schema ? quoteIdentifier(schema) + '.' : '') +
    (table ? quoteIdentifier(table) + '.' : '') +
    quoteIdentifier(column);

  const quotedAlias = alias ? ` AS ${quoteIdentifier(alias)}` : '';

  return `${qualified}${quotedAlias}`;
}
