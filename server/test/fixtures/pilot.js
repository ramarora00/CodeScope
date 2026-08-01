const PILOT_FIXTURES = [
  {
    name: "express-basic",
    snapshot: {
      repoId: "express-basic",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { express: '^4.17.1' } }) }],
        ['f2', { id: 'f2', path: 'src/index.js', content: 'const express = require("express");' }],
        ['f3', { id: 'f3', path: 'src/routes/users.js', content: 'module.exports = {};' }]
      ]),
      symbols: new Map([
        ['s1', { id: 's1', type: 'route', fileId: 'f3' }]
      ]),
      relationships: [
        { caller: { fileId: 'f2' }, callee: { fileId: 'f3' }, relationship: 'imports' }
      ],
      routes: [{ fileId: 'f3' }]
    },
    expected: {
      type: "api",
      framework: "express",
      entryStrategy: "express-entry",
      expectedRoot: "src/index.js",
      layer5Activated: false
    }
  },
  {
    name: "express-large",
    snapshot: {
      repoId: "express-large",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { express: '^4.17.1' } }) }],
        ['f2', { id: 'f2', path: 'server.js', content: 'const express = require("express");' }],
        ['f3', { id: 'f3', path: 'controllers/auth.js', content: 'module.exports = {};' }],
        ['f4', { id: 'f4', path: 'middleware/auth.js', content: 'module.exports = {};' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "api",
      framework: "express",
      entryStrategy: "express-entry",
      expectedRoot: "server.js",
      layer5Activated: false
    }
  },
  {
    name: "next-app-basic",
    snapshot: {
      repoId: "next-app-basic",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } }) }],
        ['f2', { id: 'f2', path: 'next.config.js', content: '' }],
        ['f3', { id: 'f3', path: 'app/layout.tsx', content: '' }],
        ['f4', { id: 'f4', path: 'app/page.tsx', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "ssr",
      framework: "next",
      entryStrategy: "app-router",
      expectedRoot: "app/layout.tsx",
      layer5Activated: false
    }
  },
  {
    name: "next-app-api",
    snapshot: {
      repoId: "next-app-api",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } }) }],
        ['f2', { id: 'f2', path: 'app/layout.tsx', content: '' }],
        ['f3', { id: 'f3', path: 'app/api/auth/route.ts', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "ssr",
      framework: "next",
      entryStrategy: "app-router",
      expectedRoot: "app/layout.tsx",
      layer5Activated: false
    }
  },
  {
    name: "next-pages-basic",
    snapshot: {
      repoId: "next-pages-basic",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { next: '^12.0.0', react: '^17.0.0' } }) }],
        ['f2', { id: 'f2', path: 'pages/_app.tsx', content: '' }],
        ['f3', { id: 'f3', path: 'pages/index.tsx', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "ssr",
      framework: "next",
      entryStrategy: "pages-router",
      expectedRoot: "pages/_app.tsx",
      layer5Activated: false
    }
  },
  {
    name: "react-vite",
    snapshot: {
      repoId: "react-vite",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { react: '^18.0.0' } }) }],
        ['f2', { id: 'f2', path: 'vite.config.ts', content: '' }],
        ['f3', { id: 'f3', path: 'src/main.tsx', content: '' }],
        ['f4', { id: 'f4', path: 'src/App.tsx', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "spa",
      framework: "react",
      entryStrategy: "react-main",
      expectedRoot: "src/main.tsx",
      layer5Activated: false
    }
  },
  {
    name: "react-cra",
    snapshot: {
      repoId: "react-cra",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { react: '^17.0.0', 'react-scripts': '4.0.0' } }) }],
        ['f3', { id: 'f3', path: 'src/index.js', content: '' }],
        ['f4', { id: 'f4', path: 'src/App.js', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "spa",
      framework: "react",
      entryStrategy: "react-main",
      expectedRoot: "src/index.js",
      layer5Activated: false
    }
  },
  {
    name: "nestjs-basic",
    snapshot: {
      repoId: "nestjs-basic",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { '@nestjs/core': '^10.0.0' } }) }],
        ['f2', { id: 'f2', path: 'nest-cli.json', content: '' }],
        ['f3', { id: 'f3', path: 'src/main.ts', content: '' }],
        ['f4', { id: 'f4', path: 'src/app.module.ts', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "api",
      framework: "nestjs",
      entryStrategy: "nestjs-main",
      expectedRoot: "src/main.ts",
      layer5Activated: false
    }
  },
  {
    name: "monorepo-pnpm",
    snapshot: {
      repoId: "monorepo-pnpm",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ workspaces: ['packages/*'], dependencies: { next: '^14.0.0' } }) }],
        ['f2', { id: 'f2', path: 'pnpm-workspace.yaml', content: '' }],
        ['f3', { id: 'f3', path: 'apps/web/package.json', content: '' }],
        ['f4', { id: 'f4', path: 'packages/ui/index.ts', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "monorepo",
      framework: "next",
      entryStrategy: "filesystem-fallback",
      expectedRoot: "package.json", // fallback behaviour as app/layout doesn't exist at root
      layer5Activated: false
    }
  },
  {
    name: "lib-cli",
    snapshot: {
      repoId: "lib-cli",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ bin: { mycli: './bin/cli.js' } }) }],
        ['f2', { id: 'f2', path: 'bin/cli.js', content: '' }],
        ['f3', { id: 'f3', path: 'src/index.js', content: '' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "cli",
      framework: null,
      entryStrategy: "bin-field",
      expectedRoot: "bin/cli.js",
      layer5Activated: false
    }
  }
];

const FAILURE_FIXTURES = [
  {
    name: "empty-repo",
    snapshot: {
      repoId: "empty-repo",
      files: new Map(),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "unknown",
      framework: null,
      entryStrategy: "filesystem-fallback",
      expectedRoot: null,
      layer5Activated: false
    }
  },
  {
    name: "readme-only",
    snapshot: {
      repoId: "readme-only",
      files: new Map([
        ['f1', { id: 'f1', path: 'README.md', content: '# Docs\nHello world' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "unknown",
      framework: null,
      entryStrategy: "filesystem-fallback",
      expectedRoot: null,
      layer5Activated: true
    }
  },
  {
    name: "broken-package-json",
    snapshot: {
      repoId: "broken-package-json",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: '{ invalid json' }],
        ['f2', { id: 'f2', path: 'index.js', content: 'console.log("hello");' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "unknown",
      framework: null,
      entryStrategy: "filesystem-fallback",
      expectedRoot: "index.js",
      layer5Activated: false
    }
  },
  {
    name: "circular-imports",
    snapshot: {
      repoId: "circular-imports",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { express: '*' } }) }],
        ['f2', { id: 'f2', path: 'src/a.js', content: 'const b = require("./b");' }],
        ['f3', { id: 'f3', path: 'src/b.js', content: 'const a = require("./a");' }],
        ['f4', { id: 'f4', path: 'src/index.js', content: 'const a = require("./a");' }]
      ]),
      symbols: new Map(),
      relationships: [
        { caller: { fileId: 'f2' }, callee: { fileId: 'f3' }, relationship: 'imports' },
        { caller: { fileId: 'f3' }, callee: { fileId: 'f2' }, relationship: 'imports' },
        { caller: { fileId: 'f4' }, callee: { fileId: 'f2' }, relationship: 'imports' }
      ],
      routes: []
    },
    expected: {
      type: "api",
      framework: "express",
      entryStrategy: "express-entry",
      expectedRoot: "src/index.js",
      layer5Activated: false
    }
  },
  {
    name: "mixed-language",
    snapshot: {
      repoId: "mixed-language",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { express: '*' } }) }],
        ['f2', { id: 'f2', path: 'src/index.js', content: 'console.log("JS");' }],
        ['f3', { id: 'f3', path: 'backend/main.py', content: 'print("Python")' }],
        ['f4', { id: 'f4', path: 'backend/utils.py', content: 'def run(): pass' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "api",
      framework: "express",
      entryStrategy: "express-entry",
      expectedRoot: "src/index.js",
      layer5Activated: false
    }
  },
  {
    name: "generated-dirs",
    snapshot: {
      repoId: "generated-dirs",
      files: new Map([
        ['f1', { id: 'f1', path: 'package.json', content: JSON.stringify({ dependencies: { next: '*' } }) }],
        ['f2', { id: 'f2', path: 'app/layout.tsx', content: 'export default function Layout() {}' }],
        ['f3', { id: 'f3', path: '.next/server/pages/index.js', content: 'minified generated code' }],
        ['f4', { id: 'f4', path: 'dist/bundle.js', content: 'minified generated code' }]
      ]),
      symbols: new Map(), relationships: [], routes: []
    },
    expected: {
      type: "ssr",
      framework: "next",
      entryStrategy: "app-router",
      expectedRoot: "app/layout.tsx",
      layer5Activated: false
    }
  }
];

module.exports = {
  PILOT_FIXTURES,
  FAILURE_FIXTURES
};
