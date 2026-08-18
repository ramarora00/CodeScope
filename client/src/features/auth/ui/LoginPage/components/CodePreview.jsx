import React from 'react';

const code=[
  ['52','function ','off(event, listener) {'],
  ['53','','  if (...) return;'],
  ['54','const ','  index = ...'],
  ['55','',''],
  ['56','','  if (index > -1) {'],
  ['57','','    this._events[event].splice(index, 1);'],
  ['58','','  }'],
  ['59','','}']
];

export default function CodePreview({ activeLine }) {
  return (
    <div className="code-preview">
      <div className="editor-top">
        <span>EXPLORER</span>
        <div className="editor-top-tabs">
          <span className="analysis-badge">● ANALYSIS ACTIVE</span>
          <b><i>JS</i> index.js <em>×</em></b>
        </div>
      </div>
      <div className="editor-body">
        <div className="tree">
          <strong>⌄ CODESCOPE-APP</strong>
          <span>In-Scope</span>
          <span className="selected">  └ index.js</span>
          <span>  └ parser.js</span>
          <span>Out-of-Scope</span>
          <span>  └ package.json</span>
        </div>
        <div className="code">
          <small>src / services / index.js</small>
          <pre>
            {code.map(([n, k, r]) => (
              <div key={n} className={Number(n) === activeLine ? 'active-scan' : ''}>
                <label>{n}</label>
                <span>{k && <b>{k}</b>}{r}</span>
              </div>
            ))}
          </pre>
          <i className="caret" />
        </div>
      </div>
    </div>
  );
}
