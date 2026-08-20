import { createHighlighter } from 'shiki';

async function test() {
  const hl = await createHighlighter({
    themes: ['github-dark-dimmed'],
    langs: ['javascript']
  });
  const tokens = hl.codeToTokens('const x = 1;', {
    lang: 'javascript',
    theme: 'github-dark-dimmed'
  });
  console.log('Result type:', Array.isArray(tokens) ? 'Array' : typeof tokens);
  console.log('Keys:', Object.keys(tokens));
  console.log('Tokens is array?', Array.isArray(tokens.tokens) ? 'Yes' : 'No');
}
test();
