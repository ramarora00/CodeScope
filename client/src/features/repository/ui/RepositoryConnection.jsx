import React, { useState } from 'react';
import { Link2, GitBranch, CheckCircle2, AlertCircle, PlayCircle, FolderGit2, X, RefreshCw } from 'lucide-react';

const ProcessingPipeline = ({ currentStep }) => {
  const steps = [
    'Repository Connected',
    'Parsing Source Files',
    'Resolving Relationships',
    'Preparing Search Index',
    'Repository Ready'
  ];

  return (
    <div className="w-full max-w-md mt-6">
      <div className="mb-4 text-sm font-medium text-text-primary">
        Preparing Repository ({Math.min(currentStep, 5)} of 5 steps completed)
      </div>
      <div className="h-px w-full bg-border mb-6" />
      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const isPending = currentStep < stepNumber;

          return (
            <div key={step} className="flex items-center gap-3">
              {isCompleted && <CheckCircle2 size={16} className="text-text-primary" />}
              {isActive && <div className="w-4 h-4 rounded-full border-[3px] border-text-primary bg-bg-surface flex-shrink-0 animate-pulse" />}
              {isPending && <div className="w-4 h-4 rounded-full border border-border bg-transparent flex-shrink-0" />}
              
              <span className={`text-sm ${
                isCompleted ? 'text-text-primary font-medium' :
                isActive ? 'text-text-primary font-medium' :
                'text-text-muted'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RepositoryConnection = ({ onUploadSuccess, existingRepos = [], onCancel }) => {
  // States: 'welcome', 'input', 'processing', 'success', 'failure', 'duplicate', 'existing'
  const [viewState, setViewState] = useState('welcome');
  const [repoUrl, setRepoUrl] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingRepoData, setExistingRepoData] = useState(null);

  const simulatePipeline = (onComplete) => {
    let step = 1;
    setCurrentStep(1);
    
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step > 5) {
        clearInterval(interval);
        onComplete();
      }
    }, 800);
  };

  const handleValidate = (e) => {
    e.preventDefault();
    if (!repoUrl) return;

    // Validate if it matches an existing repo by name parsing (basic heuristic for UI demonstration)
    const urlParts = repoUrl.split('/');
    const possibleName = urlParts[urlParts.length - 1]?.replace('.git', '');
    
    const duplicate = existingRepos.find(r => r.name.toLowerCase() === possibleName?.toLowerCase() || repoUrl.includes(r.name));

    if (duplicate) {
      setExistingRepoData(duplicate);
      // For demonstration of "duplicate" vs "existing", we'll just show existing.
      // If the user tries to connect an existing one, they should see "This repository is already connected."
      setViewState('duplicate');
      return;
    }

    startConnection();
  };

  const startConnection = async () => {
    setViewState('processing');
    setErrorMsg('');

    try {
      // In a real scenario, this endpoint should return a job ID and we poll for pipeline status.
      // Since the backend is sync or just returns success/fail, we'll simulate the UI pipeline 
      // while the fetch happens in the background, but we must wait for both to finish.
      
      const fetchPromise = fetch('http://localhost:5000/api/repo/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to clone repository');
        return data;
      });

      // Simulate pipeline progression for UX
      let step = 1;
      setCurrentStep(1);
      const pipelineInterval = setInterval(() => {
        if (step < 4) {
          step++;
          setCurrentStep(step);
        }
      }, 1000);

      const responseData = await fetchPromise;
      clearInterval(pipelineInterval);
      
      // Fast-forward remaining steps
      setCurrentStep(5);
      setTimeout(() => {
        setCurrentStep(6); // marks all done
        setExistingRepoData(responseData);
        setViewState('success');
      }, 500);

    } catch (err) {
      setErrorMsg('We couldn\'t access this repository. Verify the repository URL and your access, then try again.');
      setViewState('failure');
    }
  };

  const handleOpenRepository = () => {
    if (existingRepoData && onUploadSuccess) {
      onUploadSuccess(existingRepoData);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-main p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-lg">
        
        {viewState === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 border border-border rounded-xl bg-bg-surface text-text-secondary">
              <FolderGit2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Understand any repository.</h2>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Connect a local project or Git repository to begin building your repository model.
              </p>
            </div>
            <button 
              onClick={() => setViewState('input')}
              className="px-6 py-3 bg-text-primary text-bg-main rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              Connect Repository
            </button>
          </div>
        )}

        {viewState === 'input' && (
          <form onSubmit={handleValidate} className="flex flex-col space-y-6 animate-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Connect Repository</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 size={16} className="text-text-muted" />
                </div>
                <input
                  autoFocus
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full bg-bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-text-secondary transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => {
                  if (onCancel) onCancel();
                  else setViewState('welcome');
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!repoUrl}
                className="px-4 py-2 bg-text-primary text-bg-main rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Connect
              </button>
            </div>
          </form>
        )}

        {viewState === 'processing' && (
          <div className="flex flex-col items-center animate-in fade-in">
            <ProcessingPipeline currentStep={currentStep} />
          </div>
        )}

        {viewState === 'success' && (
          <div className="flex flex-col items-start p-6 border border-border rounded-xl bg-bg-surface animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Repository Ready</h2>
            <p className="text-sm text-text-muted mb-6">Repository indexed successfully.</p>
            <button 
              onClick={handleOpenRepository}
              className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-main rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              Open Repository <PlayCircle size={16} />
            </button>
          </div>
        )}

        {viewState === 'failure' && (
          <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Connect Repository</h2>
            <div className="p-4 border border-error/20 bg-error/5 rounded-lg flex items-start gap-3">
              <AlertCircle size={18} className="text-error mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text-primary">{errorMsg}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  if (onCancel) onCancel();
                  else setViewState('input');
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={startConnection}
                className="px-4 py-2 border border-border bg-bg-surface rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {viewState === 'duplicate' && (
          <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Connect Repository</h2>
            <div className="p-4 border border-border bg-bg-surface rounded-lg">
              <p className="text-sm text-text-primary font-medium mb-1">This repository is already connected.</p>
              <p className="text-xs text-text-muted">Last indexed recently.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  if (onCancel) onCancel();
                  else setViewState('welcome');
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={startConnection}
                className="px-4 py-2 border border-border bg-bg-surface rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-bg-hover transition-colors"
              >
                <RefreshCw size={14} />
                Reconnect
              </button>
              <button 
                onClick={handleOpenRepository}
                className="px-4 py-2 bg-text-primary text-bg-main rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
              >
                Open Repository <PlayCircle size={14} />
              </button>
            </div>
          </div>
        )}

        {viewState === 'existing' && (
          <div className="flex flex-col items-start p-6 border border-border rounded-xl bg-bg-surface animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Repository Connected</h2>
            <p className="text-sm text-text-muted mb-6">Last indexed Yesterday at 6:42 PM</p>
            <div className="flex gap-3">
              <button 
                onClick={handleOpenRepository}
                className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-main rounded-lg text-sm font-medium hover:bg-white transition-colors"
              >
                Open Repository <PlayCircle size={16} />
              </button>
              <button 
                onClick={startConnection}
                className="px-4 py-2 border border-border bg-bg-surface rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
              >
                Re-index Repository
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RepositoryConnection;
