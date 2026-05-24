const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Parses a file's content and extracts meaningful symbols (functions, classes, imports)
 * @param {string} content - The code content to parse
 * @param {string} filename - The filename (to determine parser plugins)
 * @returns {object} - Extracted metadata
 */
const parseCode = (content, filename) => {
    const metadata = {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      calls: [],
      routes: []
    };

  try {
    const isTS = filename.endsWith('.ts') || filename.endsWith('.tsx');
    const isJSX = filename.endsWith('.jsx') || filename.endsWith('.tsx');

    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: [
        isTS ? 'typescript' : 'flow',
        isJSX ? 'jsx' : null,
        'decorators-legacy',
        'classProperties',
        'objectRestSpread'
      ].filter(Boolean)
    });

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id) {
          metadata.functions.push({
            name: path.node.id.name,
            lineStart: path.node.loc.start.line,
            lineEnd: path.node.loc.end.line
          });
        }
      },
      VariableDeclaration(path) {
        path.node.declarations.forEach(d => {
          if (d.id.type === 'Identifier' && 
              (d.init?.type === 'ArrowFunctionExpression' || d.init?.type === 'FunctionExpression')) {
            metadata.functions.push({
              name: d.id.name,
              lineStart: path.node.loc.start.line,
              lineEnd: path.node.loc.end.line
            });
          }
        });
      },
      ClassDeclaration(path) {
        if (path.node.id) {
          metadata.classes.push({
            name: path.node.id.name,
            lineStart: path.node.loc.start.line,
            lineEnd: path.node.loc.end.line
          });
        }
      },
      CallExpression(path) {
        let calleeName = null;
        if (path.node.callee.type === 'Identifier') {
          calleeName = path.node.callee.name;
        } else if (path.node.callee.type === 'MemberExpression') {
          if (path.node.callee.property.type === 'Identifier') {
            calleeName = path.node.callee.property.name;
          }
        }
        if (calleeName) {
          metadata.calls.push({
            name: calleeName,
            line: path.node.loc.start.line
          });
        }

        // --- Express Route Detection ---
        const callee = path.node.callee;
        if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          const objName = callee.object.type === 'Identifier' ? callee.object.name : null;
          const methodName = callee.property.name;
          if ((objName === 'router' || objName === 'app') && 
              ['get', 'post', 'put', 'delete', 'patch', 'use'].includes(methodName)) {
            
            const firstArg = path.node.arguments[0];
            if (firstArg && (firstArg.type === 'StringLiteral' || firstArg.type === 'TemplateLiteral')) {
              const routePath = firstArg.type === 'StringLiteral' ? firstArg.value : '[Dynamic]';
              
              const handlers = [];
              for (let i = 1; i < path.node.arguments.length; i++) {
                const arg = path.node.arguments[i];
                if (arg.type === 'Identifier') {
                  handlers.push(arg.name);
                } else if (arg.type === 'MemberExpression' && arg.property.type === 'Identifier') {
                  handlers.push(arg.property.name);
                } else if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
                  handlers.push(`inline_${path.node.loc.start.line}`);
                }
              }

              metadata.routes.push({
                method: methodName.toUpperCase(),
                path: routePath,
                handlers,
                lineStart: path.node.loc.start.line,
                lineEnd: path.node.loc.end.line
              });
            }
          }
        }
      },
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers.map(spec => {
          if (spec.type === 'ImportDefaultSpecifier') {
            return { local: spec.local.name, imported: 'default' };
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            return { local: spec.local.name, imported: '*' };
          } else if (spec.type === 'ImportSpecifier') {
            const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            return { local: spec.local.name, imported: importedName };
          }
          return null;
        }).filter(Boolean);

        metadata.imports.push({
          source,
          specifiers,
          line: path.node.loc.start.line
        });
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (path.node.declaration.id) {
            metadata.exports.push({ name: path.node.declaration.id.name, type: 'named' });
          } else if (path.node.declaration.declarations) {
            path.node.declaration.declarations.forEach(d => {
              if (d.id && d.id.name) metadata.exports.push({ name: d.id.name, type: 'named' });
            });
          }
        } else if (path.node.specifiers) {
          path.node.specifiers.forEach(spec => {
            const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
            metadata.exports.push({ name: exportedName, type: 'named' });
          });
        }
      },
      ExportDefaultDeclaration(path) {
        // We can capture the name if it has one, otherwise just mark default export
        let name = 'default';
        if (path.node.declaration && path.node.declaration.id) {
            name = path.node.declaration.id.name;
        }
        metadata.exports.push({ name, type: 'default' });
      }
    });

    return metadata;
  } catch (err) {
    // console.error(`Error parsing ${filename}:`, err.message);
    return null; // Return null if parsing fails (e.g. non-JS files)
  }
};

module.exports = { parseCode };
