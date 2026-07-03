/**
 * shared/icons/index.js
 *
 * Purpose:     Single controlled re-export point for all icons used across
 *              the application. Icons are sourced from lucide-react.
 *              Only import from here — never import lucide-react directly in
 *              feature or UI files. This keeps the icon set curated and
 *              replaceable without touching every consumer.
 *
 * Usage:       import { Search, ChevronRight } from '@/shared/icons';
 *
 * Icon naming: Use PascalCase matching lucide-react export names exactly.
 *              Add new icons here as they are needed by new primitives.
 */

// Navigation & Wayfinding
export { ChevronRight, ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react';
export { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

// Search & Command
export { Search, Command, SlidersHorizontal } from 'lucide-react';

// Actions & Verbs (Analyze / Trace / Ask / Open grammar)
export { Zap, GitBranch, MessageSquare, ExternalLink, Copy, Download } from 'lucide-react';

// Status & Feedback
export { CheckCircle, AlertCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';

// System & Repository
export { FolderOpen, File, GitCommit, Activity, RefreshCw, Loader2 } from 'lucide-react';

// Graph & Visualization
export { Network, Share2, Layers, Circle, Dot } from 'lucide-react';

// AI & Intelligence
export { Sparkles, BrainCircuit, Eye } from 'lucide-react';

// Layout & UI
export { PanelLeft, PanelRight, Maximize2, Minimize2, SplitSquareVertical } from 'lucide-react';

// Settings
export { Settings, KeyRound, Moon, Sun } from 'lucide-react';
