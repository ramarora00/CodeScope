const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Parses a file's content and extracts meaningful symbols (functions, classes, imports, exports, calls, routes).
 * Supports ES6 modules, CommonJS require/module.exports, re-exports, and import aliases.
 *
 * @param {string} content - The code content to parse
 * @param {string} filename - The filename (to determine parser plugins)
 * @returns {object|null} - Extracted metadata, or null if parsing fails
 */
const parseCode = (content, filename) => {
    const metadata = {
      functions: [],
      classes: [],
      imports: [],      // { source, specifiers: [{ local, imported, kind }], line, isRelative }
      exports: [],      // { name, type: 'named'|'default'|'reexport', source? }
      calls: [],        // { name, objectName?, line }
      routes: [],       // { method, path, handlers[], lineStart, lineEnd }
      requires: [],     // CommonJS: { local, source, isRelative, line }
      moduleExports: [] // CommonJS: { name, line }
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
        'objectRestSpread',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator'
      ].filter(Boolean)
    });

    traverse(ast, {
      // --- Function Declarations ---
      FunctionDeclaration(path) {
        if (path.node.id) {
          metadata.functions.push({
            name: path.node.id.name,
            lineStart: path.node.loc.start.line,
            lineEnd: path.node.loc.end.line
          });
        }
      },

      // --- Arrow functions and function expressions assigned to variables ---
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

          // --- CommonJS: const { login, register } = require('./auth') ---
          if (d.init?.type === 'CallExpression' &&
              d.init.callee?.type === 'Identifier' &&
              d.init.callee.name === 'require' &&
              d.init.arguments[0]?.type === 'StringLiteral') {

            const source = d.init.arguments[0].value;
            const isRelative = source.startsWith('.') || source.startsWith('/');

            if (d.id.type === 'ObjectPattern') {
              // Destructured require: const { login, register } = require('./auth')
              d.id.properties.forEach(prop => {
                if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.value.type === 'Identifier') {
                  metadata.requires.push({
                    local: prop.value.name,
                    imported: prop.key.name,
                    source,
                    isRelative,
                    line: path.node.loc.start.line
                  });
                }
              });
            } else if (d.id.type === 'Identifier') {
              // Simple require: const authService = require('./auth')
              metadata.requires.push({
                local: d.id.name,
                imported: 'default',
                source,
                isRelative,
                line: path.node.loc.start.line
              });
            }
          }
        });
      },

      // --- Class Declarations ---
      ClassDeclaration(path) {
        if (path.node.id) {
          metadata.classes.push({
            name: path.node.id.name,
            lineStart: path.node.loc.start.line,
            lineEnd: path.node.loc.end.line
          });
        }
      },

      // --- Call Expressions (function calls, method calls, route definitions) ---
      CallExpression(path) {
        let calleeName = null;
        let objectName = null;

        if (path.node.callee.type === 'Identifier') {
          calleeName = path.node.callee.name;
        } else if (path.node.callee.type === 'MemberExpression') {
          if (path.node.callee.property.type === 'Identifier') {
            calleeName = path.node.callee.property.name;
          }
          if (path.node.callee.object.type === 'Identifier') {
            objectName = path.node.callee.object.name;
          }
        }

        if (calleeName) {
          metadata.calls.push({
            name: calleeName,
            objectName: objectName || null,
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

      // --- ES6 Import Declarations ---
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const isRelative = source.startsWith('.') || source.startsWith('/');
        const specifiers = path.node.specifiers.map(spec => {
          if (spec.type === 'ImportDefaultSpecifier') {
            return { local: spec.local.name, imported: 'default', kind: 'default' };
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            return { local: spec.local.name, imported: '*', kind: 'namespace' };
          } else if (spec.type === 'ImportSpecifier') {
            const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            return { local: spec.local.name, imported: importedName, kind: 'named' };
          }
          return null;
        }).filter(Boolean);

        metadata.imports.push({
          source,
          specifiers,
          isRelative,
          line: path.node.loc.start.line
        });
      },

      // --- Named Exports ---
      ExportNamedDeclaration(path) {
        // Re-export: export { login } from './auth' or export * from './helpers'
        if (path.node.source) {
          const reexportSource = path.node.source.value;
          if (path.node.specifiers && path.node.specifiers.length > 0) {
            path.node.specifiers.forEach(spec => {
              const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
              const localName = spec.local.type === 'Identifier' ? spec.local.name : spec.local.value;
              metadata.exports.push({ name: exportedName, type: 'reexport', source: reexportSource, originalName: localName });
            });
          }
          return;
        }

        // Direct named export: export function login() {} or export const x = ...
        if (path.node.declaration) {
          if (path.node.declaration.id) {
            metadata.exports.push({ name: path.node.declaration.id.name, type: 'named' });
          } else if (path.node.declaration.declarations) {
            path.node.declaration.declarations.forEach(d => {
              if (d.id && d.id.name) metadata.exports.push({ name: d.id.name, type: 'named' });
            });
          }
        } else if (path.node.specifiers) {
          // export { login, register }
          path.node.specifiers.forEach(spec => {
            const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
            metadata.exports.push({ name: exportedName, type: 'named' });
          });
        }
      },

      // --- Default Exports ---
      ExportDefaultDeclaration(path) {
        let name = 'default';
        if (path.node.declaration && path.node.declaration.id) {
            name = path.node.declaration.id.name;
        }
        metadata.exports.push({ name, type: 'default' });
      },

      // --- Export All: export * from './helpers' ---
      ExportAllDeclaration(path) {
        if (path.node.source) {
          metadata.exports.push({
            name: '*',
            type: 'reexport',
            source: path.node.source.value
          });
        }
      },

      // --- CommonJS module.exports ---
      AssignmentExpression(path) {
        const left = path.node.left;

        // module.exports = { login, register }
        if (left.type === 'MemberExpression' &&
            left.object.type === 'Identifier' && left.object.name === 'module' &&
            left.property.type === 'Identifier' && left.property.name === 'exports') {

          const right = path.node.right;
          if (right.type === 'ObjectExpression') {
            right.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                metadata.moduleExports.push({ name: prop.key.name, line: path.node.loc.start.line });
              }
            });
          } else if (right.type === 'Identifier') {
            metadata.moduleExports.push({ name: right.name, line: path.node.loc.start.line });
          }
        }

        // module.exports.login = ...
        if (left.type === 'MemberExpression' &&
            left.object.type === 'MemberExpression' &&
            left.object.object.type === 'Identifier' && left.object.object.name === 'module' &&
            left.object.property.type === 'Identifier' && left.object.property.name === 'exports' &&
            left.property.type === 'Identifier') {
          metadata.moduleExports.push({ name: left.property.name, line: path.node.loc.start.line });
        }

        // exports.login = ...
        if (left.type === 'MemberExpression' &&
            left.object.type === 'Identifier' && left.object.name === 'exports' &&
            left.property.type === 'Identifier') {
          metadata.moduleExports.push({ name: left.property.name, line: path.node.loc.start.line });
        }
      }
    });

    return metadata;
  } catch (err) {
    // Return null if parsing fails (e.g. non-JS files, syntax errors)
    return null;
  }
};

module.exports = { parseCode };
