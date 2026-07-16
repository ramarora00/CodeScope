import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Link2, Cpu } from 'lucide-react';

// Static knowledge map for each file in the simulation
const FILE_KNOWLEDGE = {
  'auth.ts': {
    imports: ['express', './jwt', '../models/user', '../utils/logger'],
    exports: ['authenticate(req, res, next)', 'softAuth(req, res, next)'],
    relations: [
      { name: 'jwt.ts', confidence: 98, reason: 'verifyJWT called' },
      { name: 'user.ts', confidence: 91, reason: 'getUserById called' },
      { name: 'logger.ts', confidence: 80, reason: 'request logging' }
    ]
  },
  'jwt.ts': {
    imports: ['jsonwebtoken', './types'],
    exports: ['signJWT(payload)', 'verifyJWT(token)', 'decodeJWT(token)'],
    relations: [
      { name: 'auth.ts', confidence: 98, reason: 'caller' },
      { name: 'types.ts', confidence: 88, reason: 'JwtPayload type' },
      { name: '.env', confidence: 95, reason: 'JWT_SECRET required' }
    ]
  },
  'user.ts': {
    imports: ['../db/connection', './types'],
    exports: ['getUserById(id)', 'getUserByEmail(email)', 'createUser(input)', 'deactivateUser(id)'],
    relations: [
      { name: 'db/connection.ts', confidence: 99, reason: 'SQL queries' },
      { name: 'auth.ts', confidence: 91, reason: 'identity lookup' },
      { name: 'types.ts', confidence: 85, reason: 'User type' }
    ]
  }
};

const DEFAULT_KNOWLEDGE = {
  imports: ['—'],
  exports: ['—'],
  relations: []
};

export default function KnowledgePanel({ activeFile, attention = {} }) {
  const fileKey = activeFile?.name || attention?.file || null;
  const context = (fileKey && FILE_KNOWLEDGE[fileKey]) || DEFAULT_KNOWLEDGE;

  // Highlight the relation that matches the current attention symbol
  const activeRelation = attention?.symbol
    ? context.relations.find(r =>
        r.name.toLowerCase().includes(attention.symbol?.toLowerCase() || '')
      )
    : null;

  return (
    <aside className="w-[264px] bg-[#080A0F] border-l border-white/[0.04] flex flex-col select-none h-full relative z-20 flex-shrink-0">

      {/* Header */}
      <div className="h-9 px-3.5 border-b border-white/[0.04] bg-[#0a0a0b] flex items-center justify-between text-[10px] font-semibold text-[#3a3a3e] uppercase tracking-widest">
        <span>Knowledge</span>
        {fileKey && (
          <span className="font-mono text-[#5f5f63] normal-case tracking-normal text-[10px]">
            {fileKey}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-5">

        {/* Active symbol callout */}
        {attention?.symbol && (
          <div className="rounded border border-[#8b8dee]/15 bg-[#8b8dee]/[0.04] px-3 py-2.5">
            <div className="text-[9px] font-bold text-[#8b8dee] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Cpu size={9} />
              <span>Symbol Focus</span>
            </div>
            <div className="font-mono text-[11.5px] text-[#c7c7ce]">{attention.symbol}</div>
            {attention.reason && (
              <div className="text-[10px] text-[#5f5f63] mt-1 font-sans leading-snug italic">
                {attention.reason}
              </div>
            )}
          </div>
        )}

        {/* IMPORTS */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-[#3a3a3e] uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft size={10} className="text-[#5f5f63]" />
            <span>Imports</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {context.imports.map((item, idx) => (
              <div
                key={idx}
                className="font-mono text-[10.5px] text-[#5f5f63] py-0.5 px-1.5 rounded hover:bg-white/[0.02] truncate transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* EXPORTS */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-[#3a3a3e] uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight size={10} className="text-[#5f5f63]" />
            <span>Exports</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {context.exports.map((item, idx) => (
              <div
                key={idx}
                className="font-mono text-[10.5px] text-[#8e97a8] py-0.5 px-1.5 rounded hover:bg-white/[0.02] truncate transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* RELATIONSHIPS */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-[#3a3a3e] uppercase tracking-wider flex items-center gap-1.5">
            <Link2 size={10} className="text-[#5f5f63]" />
            <span>Relations</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {context.relations.map((rel, idx) => {
              const isActive = activeRelation?.name === rel.name;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-1 px-1.5 rounded transition-all duration-300 ${
                    isActive
                      ? 'bg-[#8b8dee]/[0.07] border border-[#8b8dee]/15'
                      : 'hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`font-mono text-[10.5px] truncate ${isActive ? 'text-[#c7c7ce]' : 'text-[#5f5f63]'}`}>
                      {rel.name}
                    </span>
                    <span className="text-[9px] text-[#3a3a3e] font-sans truncate">{rel.reason}</span>
                  </div>
                  <span className="text-[9.5px] text-[#4a5260] font-mono ml-2 flex-shrink-0">
                    {rel.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}
