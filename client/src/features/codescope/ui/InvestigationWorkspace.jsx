import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Sparkles, Folder, Network, History, 
  Settings, ChevronRight, Search, Menu, PanelRight, ChevronDown, Check
} from 'lucide-react';
import OperationLog from './OperationLog';
import EvidenceBlock from './EvidenceBlock';
import { RepositoryGraphCanvas } from '../../repository-graph';
import AIObservatory from '../../../components/AIObservatory';
import FileExplorerDrawer from '../../repository/ui/FileExplorerDrawer';

export default function InvestigationWorkspace({ 
  repo, 
  repos = [], 
  onSelectRepo, 
  onConnectNew,
  activeInvestigation, 
  onNewInvestigation 
}) {
  const [activeView, setActiveView] = useState('code'); // 'code' | 'relationships' | 'execution'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileMeta, setFileMeta] = useState(null);
  
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  // Switch panels / settings
  const [showRepoSwitcher, setShowRepoSwitcher] = useState(false);
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showProgressLog, setShowProgressLog] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Fetch graph database for Relationships View
  useEffect(() => {
    if (repo && activeView === 'relationships') {
      fetchGraphData();
    }
  }, [repo, activeView]);

  // Fetch selected file details
  useEffect(() => {
    if (repo && selectedFile) {
      fetchFileContent(selectedFile.path);
    }
  }, [repo, selectedFile]);

  // Auto-select first file from investigation evidence if it exists
  useEffect(() => {
    if (activeInvestigation && activeInvestigation.evidence?.files?.length > 0) {
      const firstFile = activeInvestigation.evidence.files[0];
      setSelectedFile(firstFile);
    }
  }, [activeInvestigation]);

  const fetchGraphData = async () => {
    setGraphLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/symbols/graph`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to load graph data', err);
    } finally {
      setGraphLoading(false);
    }
  };

  const fetchFileContent = async (path) => {
    setFileLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || '');
        setFileMeta(data.metadata ? JSON.parse(data.metadata) : null);
      }
    } catch (err) {
      console.error('Failed to fetch file content', err);
    } finally {
      setFileLoading(false);
    }
  };

  const handleSelectResult = (result) => {
    setSelectedFile({ name: result.name, path: result.path });
    setActiveView('code');
  };

  const handleSelectNode = (nodeId) => {
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (node && node.data?.filePath) {
      setSelectedFile({ name: node.data.name, path: node.data.filePath });
      setActiveView('code');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onNewInvestigation(searchInput.trim());
      setSearchInput('');
    }
  };

  // Mock static timeline trace mapping to 'login reaching database' inside repo-auth
  const traceSteps = [
    { name: 'index.js', path: 'index.js', desc: 'POST /login endpoint definition', line: 1 },
    { name: 'loginController.js', path: 'loginController.js', desc: 'login() router controller execution', line: 1 },
    { name: 'authService.js', path: 'authService.js', desc: 'authenticateUser() validation database lookup', line: 1 },
    { name: 'userModel.js', path: 'userModel.js', desc: 'findUserByEmail() query resolver execution', line: 1 }
  ];

  return (
    <div className="flex-1 flex bg-[#05070B] min-h-screen text-[#D8DCE6] overflow-hidden">
      
      {/* File Drawer Overlay */}
      <FileExplorerDrawer 
        isOpen={fileDrawerOpen}
        onClose={() => setFileDrawerOpen(false)}
        repo={repo}
        onFileSelect={(file) => {
          setSelectedFile(file);
          setActiveView('code');
          setFileDrawerOpen(false);
        }}
      />

      {/* ── LEFT SIDEBAR: Navigation Strip ── */}
      <aside className="w-12 border-r border-white/5 bg-[#080A0F] flex flex-col items-center py-4 justify-between select-none z-30">
        <div className="flex flex-col items-center gap-6 w-full relative">
          
          {/* Logo / CodeScope Icon */}
          <div className="w-8 h-8 rounded-lg bg-[#0A0E15] border border-white/5 flex items-center justify-center">
            <span className="text-[12px] font-bold tracking-tight text-[#D8DCE6]">C</span>
          </div>
          
          <div className="w-px h-6 bg-white/5" />

          {/* Repository Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowRepoSwitcher(!showRepoSwitcher)}
              className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors ${showRepoSwitcher ? 'bg-white/5 text-[#3B82F6]' : 'text-[#8E97A8]'}`}
              title="Repositories"
            >
              <Database size={16} />
            </button>
            
            {/* Repo Switcher Dropdown */}
            <AnimatePresence>
              {showRepoSwitcher && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRepoSwitcher(false)} />
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-10 top-0 w-64 bg-[#0A0E15] border border-white/5 rounded-lg p-2 shadow-2xl z-50 text-left"
                  >
                    <div className="text-[9px] font-bold text-[#5C657A] uppercase px-3 py-1.5 border-b border-white/5 mb-1.5 flex justify-between items-center">
                      <span>Switch Repository</span>
                      <button 
                        onClick={() => { setShowRepoSwitcher(false); onConnectNew(); }}
                        className="hover:text-[#D8DCE6] text-[#5C657A]"
                      >
                        + Connect New
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col">
                      {repos.map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            onSelectRepo(r);
                            setShowRepoSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-[11px] font-mono flex items-center justify-between hover:bg-white/5 transition-colors ${
                            repo?.id === r.id ? 'text-[#3B82F6]' : 'text-[#8E97A8]'
                          }`}
                        >
                          <span className="truncate">{r.name.replace(/repo-?/i, '')}</span>
                          {repo?.id === r.id && <Check size={12} className="text-[#3B82F6] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Browse Files */}
          <button 
            onClick={() => setFileDrawerOpen(true)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#8E97A8] hover:bg-white/5 transition-colors"
            title="Browse Files"
          >
            <Folder size={16} />
          </button>

          {/* Relationships Graph */}
          <button 
            onClick={() => {
              setActiveView(activeView === 'relationships' ? 'code' : 'relationships');
            }}
            className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors ${activeView === 'relationships' ? 'bg-white/5 text-[#3B82F6]' : 'text-[#8E97A8]'}`}
            title="Relationships Graph"
          >
            <Network size={16} />
          </button>

          {/* AI Copilot Toggle */}
          <button 
            onClick={() => setAssistantOpen(!assistantOpen)}
            className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors ${assistantOpen ? 'bg-white/5 text-[#3B82F6]' : 'text-[#8E97A8]'}`}
            title="AI Copilot"
          >
            <Sparkles size={16} />
          </button>
        </div>

        {/* Bottom Panel Settings */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={() => {
              // trigger global settings modal or toggle Settings panel
            }}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#8E97A8] hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0E15]">
        
        {/* Header */}
        <header className="h-14 border-b border-white/5 bg-[#0A0E15] px-6 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-mono font-semibold text-[#D8DCE6]">
              {repo ? repo.name.replace(/repo-?/i, '') : 'No Project'}
            </span>
            <ChevronRight size={12} className="text-[#5C657A]" />
            
            {/* Small Expandable Index Status Log */}
            <div className="relative">
              <button 
                onClick={() => setShowProgressLog(!showProgressLog)}
                className="flex items-center gap-1.5 px-2 py-0.5 border border-white/5 rounded text-[10px] text-[#8E97A8] hover:text-[#D8DCE6] hover:bg-white/5 transition-all"
              >
                <span>Indexed {repo?.files?.length || 6} files</span>
                <ChevronDown size={10} className={`transform transition-transform ${showProgressLog ? 'rotate-180' : ''}`} />
              </button>
              
              {showProgressLog && (
                <div className="absolute top-7 left-0 w-64 bg-[#080A0F] border border-white/5 rounded-lg p-3 shadow-2xl z-40">
                  <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider mb-2">Indexing Summary</div>
                  <div className="text-[11px] font-mono text-[#8E97A8] space-y-1">
                    <div>Status: Ready</div>
                    <div>Source: Git Local</div>
                    <div>Files: {repo?.files?.length || 6} parsed</div>
                    <div>Call graph relationships: resolved</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Header Search Query */}
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ask anything... Search codebase..."
              className="w-full bg-[#05070B] border border-white/5 rounded-md py-1.5 pl-8 pr-4 text-[11px] text-[#D8DCE6] placeholder-[#5C657A] outline-none focus:border-[#3B82F6] transition-colors font-sans"
            />
            <Search size={11} className="absolute left-2.5 top-2.5 text-[#5C657A]" />
          </form>

          {/* Right Header AI Toggle Button */}
          <button 
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex items-center gap-1.5 text-[10px] font-medium text-[#8E97A8] hover:text-[#D8DCE6]"
          >
            <PanelRight size={14} />
            <span>Assistant</span>
          </button>
        </header>

        {/* Investigation Workspace Page */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-6">
            
            {!activeInvestigation ? (
              /* Idle Landing view */
              <div className="flex-grow flex flex-col items-center justify-center select-none text-center max-w-xl mx-auto space-y-8">
                <div className="space-y-2">
                  <h2 className="text-[16px] font-medium text-[#D8DCE6]">Ask anything about {repo ? repo.name.replace(/repo-?/i, '') : 'this repository'}</h2>
                  <p className="text-[12px] text-[#5C657A] max-w-sm mx-auto">
                    Type a query in the header search bar to resolve imports, trace routes, and view execution paths.
                  </p>
                </div>
                
                <div className="w-full border border-white/5 rounded-lg p-4 bg-[#080A0F] text-left space-y-3">
                  <span className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Search Filters Available</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8E97A8]">
                    <div className="flex items-center gap-2 py-1 px-2 border border-white/5 rounded bg-[#0A0E15]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      <span>Search files</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 border border-white/5 rounded bg-[#0A0E15]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7A8F7B]" />
                      <span>Search symbols</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 border border-white/5 rounded bg-[#0A0E15]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B8475]" />
                      <span>Search APIs</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 px-2 border border-white/5 rounded bg-[#0A0E15]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B6B6B]" />
                      <span>Search routes</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Progressive Investigation notebook flow */
              <div className="space-y-6 flex-grow flex flex-col">
                
                {/* Block 1: Question */}
                <div className="border-b border-white/5 pb-4">
                  <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Question</div>
                  <h2 className="text-[15px] font-medium text-[#D8DCE6] mt-1">{activeInvestigation.title}</h2>
                </div>

                {/* Block 2: Operation Log (query search steps) */}
                {activeInvestigation.operations && activeInvestigation.operations.length > 0 && (
                  <OperationLog operations={activeInvestigation.operations} />
                )}

                {/* Block 3: Evidence (dense inline row elements) */}
                {activeInvestigation.evidence && (
                  <EvidenceBlock 
                    files={activeInvestigation.evidence.files || []}
                    symbols={activeInvestigation.evidence.symbols || []}
                    routes={activeInvestigation.evidence.routes || []}
                    onSelectResult={handleSelectResult}
                  />
                )}

                {/* Block 4: Workspace Code / Graph Panel (with slide-left adaptive views) */}
                {selectedFile && (
                  <div className="flex-grow flex flex-col border border-white/5 rounded-lg bg-[#080A0F] overflow-hidden min-h-[460px] relative">
                    
                    {/* Workspace Header Actions */}
                    <div className="h-9 border-b border-white/5 bg-[#0A0E15] px-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E97A8]">
                        <span className="text-[#5C657A]">{selectedFile.path.split('/').slice(0, -1).join('/') || '/'}</span>
                        <span className="text-[#5C657A]">/</span>
                        <span className="text-[#D8DCE6] font-medium">{selectedFile.name}</span>
                      </div>
                      
                      {/* Monospace view selector action links */}
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <button 
                          onClick={() => setActiveView('code')}
                          className={`hover:text-[#D8DCE6] transition-colors ${activeView === 'code' ? 'text-[#3B82F6] font-bold' : 'text-[#5C657A]'}`}
                        >
                          Code
                        </button>
                        <span className="text-white/5">|</span>
                        <button 
                          onClick={() => setActiveView('relationships')}
                          className={`hover:text-[#D8DCE6] transition-colors ${activeView === 'relationships' ? 'text-[#3B82F6] font-bold' : 'text-[#5C657A]'}`}
                        >
                          Relationships
                        </button>
                        <span className="text-white/5">|</span>
                        <button 
                          onClick={() => setActiveView('execution')}
                          className={`hover:text-[#D8DCE6] transition-colors ${activeView === 'execution' ? 'text-[#3B82F6] font-bold' : 'text-[#5C657A]'}`}
                        >
                          Execution
                        </button>
                      </div>
                    </div>

                    {/* View Slider Container */}
                    <div className="flex-1 flex relative overflow-hidden bg-[#05070B]">
                      
                      {/* VIEW 1: Code */}
                      <motion.div
                        animate={{ x: activeView === 'code' ? '0%' : '-100%' }}
                        transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                        className="absolute inset-0 w-full h-full flex flex-col flex-shrink-0"
                      >
                        <div className="flex-1 grid grid-cols-[1fr_200px] divide-x divide-white/5 overflow-hidden">
                          {/* File Content */}
                          <div className="overflow-auto p-4 custom-scrollbar font-mono text-[12px] leading-relaxed select-text selection:bg-[#3B82F6]/30">
                            {fileLoading ? (
                              <div className="w-full h-full flex items-center justify-center text-[#5C657A]">Loading file...</div>
                            ) : (
                              <pre className="tab-size-2"><code>{fileContent}</code></pre>
                            )}
                          </div>
                          
                          {/* Symbol outline definitions */}
                          <div className="p-3 bg-[#080A0F] overflow-y-auto custom-scrollbar select-none">
                            <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider mb-2">Definitions</div>
                            <div className="space-y-1.5">
                              {fileMeta && fileMeta.functions && fileMeta.functions.map((fn, idx) => (
                                <div key={idx} className="p-1.5 border border-white/5 rounded text-[10px] font-mono text-[#8E97A8] hover:bg-white/5 flex items-center justify-between">
                                  <span className="truncate pr-1">{fn.name}</span>
                                  <span className="text-[8px] text-[#5C657A] flex-shrink-0">L{fn.lineStart}</span>
                                </div>
                              ))}
                              {(!fileMeta || !fileMeta.functions || fileMeta.functions.length === 0) && (
                                <div className="text-[9px] text-[#5C657A]">No outline definitions.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* VIEW 2: Relationships Graph */}
                      <motion.div
                        animate={{ x: activeView === 'relationships' ? '0%' : '100%' }}
                        transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                        className="absolute inset-0 w-full h-full flex flex-col flex-shrink-0"
                      >
                        <div className="flex-1 relative overflow-hidden bg-[#05070B]">
                          {graphLoading ? (
                            <div className="w-full h-full flex items-center justify-center text-[#5C657A]">Loading symbol graph...</div>
                          ) : (
                            <RepositoryGraphCanvas 
                              nodes={graphData.nodes}
                              edges={graphData.edges}
                              status={graphLoading ? 'loading' : 'ready'}
                              onSelectNode={handleSelectNode}
                            />
                          )}
                        </div>
                      </motion.div>

                      {/* VIEW 3: Execution timeline trace */}
                      <motion.div
                        animate={{ x: activeView === 'execution' ? '0%' : '100%' }}
                        transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                        className="absolute inset-0 w-full h-full flex flex-col flex-shrink-0 overflow-y-auto p-6 bg-[#080A0F]"
                      >
                        <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider mb-4">Execution Path Trace</div>
                        <div className="flex flex-col relative pl-6 space-y-4">
                          {/* Vertical Path Line */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/5" />
                          
                          {traceSteps.map((step, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedFile({ name: step.name, path: step.path });
                                setActiveView('code');
                              }}
                              className="flex items-start gap-3 text-left w-full hover:bg-white/5 p-2 rounded border border-transparent hover:border-white/5 transition-all"
                            >
                              <div className="w-4 h-4 rounded-full bg-[#0A0D12] border border-[#7A8F7B] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#7A8F7B]" />
                              </div>
                              <div>
                                <div className="text-[12px] font-mono text-[#D8DCE6]">{step.name}</div>
                                <div className="text-[10px] text-[#5C657A]">{step.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
                
                {/* Conclusion reasoning prose */}
                {activeInvestigation.conclusion && (
                  <div className="border border-white/5 rounded-lg p-4 bg-white/[0.01] space-y-2 select-text selection:bg-[#3B82F6]/30">
                    <span className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Conclusion</span>
                    <div className="text-[12px] text-[#8E97A8] leading-relaxed whitespace-pre-wrap">
                      {activeInvestigation.conclusion}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR: Collapsible Assistant Panel ── */}
          <AnimatePresence>
            {assistantOpen && (
              <motion.aside 
                initial={{ width: 0 }}
                animate={{ width: 320 }}
                exit={{ width: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                className="border-l border-white/5 bg-[#080A0F] h-full flex flex-col flex-shrink-0 overflow-hidden"
              >
                <div className="w-80 flex flex-col h-full">
                  <AIObservatory 
                    activeInvestigation={activeInvestigation} 
                    selectedFile={selectedFile}
                    onOpenFile={(file) => {
                      setSelectedFile(file);
                      setActiveView('code');
                    }}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
