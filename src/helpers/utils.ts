const DANGEROUS_PATTERNS = [
  /;\s*$/,
  /UNION/i,
  /DROP/i,
  /DELETE/i,
  /UPDATE/i,
  /INSERT/i,
  /ALTER/i,
  /EXEC/i,
];

function quoteIdentifier(identifier: string): string {
  if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(identifier))) {
    throw new Error('Invalid condition pattern detected');
  }
  if (/^".+"$/.test(identifier)) return identifier;
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function quoteColumns(expressions: string[]): string[] {
  return expressions.map((expression) => {
    return quoteColumn(expression);
  });
}

export function quoteColumn(expression: string): string {
  if (expression === '*') return '*';

  // Check if it's a function call
  const functionRegex =
    /^\s*([A-Z_][A-Z0-9_]*)\s*\(\s*(.*?)\s*\)(?:\s+(?:AS\s+)?([a-zA-Z_][\w$]*))?\s*$/i;
  const functionMatch = expression.match(functionRegex);

  if (functionMatch) {
    const [, functionName, args, alias] = functionMatch;

    // Process function arguments
    let processedArgs = '';
    if (!args) {
      return '';
    }
    if (args.trim()) {
      if (args.trim() === '*') {
        processedArgs = '*';
      } else {
        // Split arguments by comma, but be careful with nested functions
        const argList = parseArguments(args);
        processedArgs = argList
          .map((arg) => {
            const trimmedArg = arg.trim();
            if (trimmedArg === '*') {
              return '*';
            }
            // Recursively process each argument (could be another function or column)
            return quoteColumn(trimmedArg);
          })
          .join(', ');
      }
    }

    const quotedAlias = alias ? ` AS ${quoteIdentifier(alias)}` : '';

    if (functionName) {
      return `${functionName.toUpperCase()}(${processedArgs})${quotedAlias}`;
    }
  }

  // Original column parsing logic
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

// Helper function to parse function arguments, handling nested parentheses
function parseArguments(args: string): string[] {
  if (!args.trim()) return [];

  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < args.length; i++) {
    const char = args[i];

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (inQuotes && char === quoteChar) {
      // Check if it's an escaped quote
      if (args[i + 1] === quoteChar) {
        current += char + char;
        i++; // Skip the next character
      } else {
        inQuotes = false;
        quoteChar = '';
        current += char;
      }
    } else if (!inQuotes && char === '(') {
      depth++;
      current += char;
    } else if (!inQuotes && char === ')') {
      depth--;
      current += char;
    } else if (!inQuotes && char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
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
