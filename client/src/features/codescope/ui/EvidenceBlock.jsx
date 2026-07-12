import React from 'react';
import { File, Hash, Globe } from 'lucide-react';

export default function EvidenceBlock({ files = [], symbols = [], routes = [], onSelectResult }) {
  const totalResults = files.length + symbols.length + routes.length;

  if (totalResults === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col space-y-3 mb-4 select-none">
      {/* Dense Row Summary */}
      <div className="flex items-center gap-1.5 text-[10px] text-[#5C657A] font-mono">
        <span className="font-bold text-[#D8DCE6]">FOUND:</span>
        <span>{totalResults} {totalResults === 1 ? 'reference' : 'references'}</span>
        <span>•</span>
        <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
        {routes.length > 0 && (
          <>
            <span>•</span>
            <span>{routes.length} {routes.length === 1 ? 'route' : 'routes'}</span>
          </>
        )}
      </div>

      {/* Dense hairline row list */}
      <div className="flex flex-col border border-white/5 rounded bg-[#080A0F] max-h-48 overflow-y-auto custom-scrollbar divide-y divide-white/5">
        {/* Files */}
        {files.map((file, idx) => (
          <div 
            key={`file-${file.path}-${idx}`}
            onClick={() => onSelectResult({ type: 'file', path: file.path, name: file.name })}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-white/5 cursor-pointer text-[11px] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <File size={12} className="text-[#5C657A] flex-shrink-0" />
              <span className="font-mono text-[#D8DCE6] truncate">{file.name}</span>
            </div>
            <span className="font-mono text-[#5C657A] truncate text-[9px] pl-4 max-w-xs">{file.path}</span>
          </div>
        ))}

        {/* Symbols */}
        {symbols.map((sym, idx) => (
          <div 
            key={`symbol-${sym.name}-${idx}`}
            onClick={() => onSelectResult({ type: 'symbol', path: sym.filePath, name: sym.name, symbol: sym })}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-white/5 cursor-pointer text-[11px] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Hash size={12} className="text-[#5C657A] flex-shrink-0" />
              <span className="font-mono text-[#D8DCE6] truncate">
                {sym.name} <span className="text-[9px] text-[#5C657A] font-sans">({sym.type})</span>
              </span>
            </div>
            <span className="font-mono text-[#5C657A] truncate text-[9px] pl-4 max-w-xs">{sym.filePath || sym.file?.path}</span>
          </div>
        ))}

        {/* Routes */}
        {routes.map((rt, idx) => (
          <div 
            key={`route-${rt.name}-${idx}`}
            onClick={() => onSelectResult({ type: 'route', path: rt.filePath || rt.file?.path, name: rt.name, symbol: rt })}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-white/5 cursor-pointer text-[11px] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Globe size={12} className="text-[#5C657A] flex-shrink-0" />
              <span className="font-mono text-[#D8DCE6] truncate">{rt.name}</span>
            </div>
            <span className="font-mono text-[#5C657A] truncate text-[9px] pl-4 max-w-xs">{rt.filePath || rt.file?.path}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
