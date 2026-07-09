import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/shared/ui';
import { cn } from '@/shared/utils';
import WorkspaceTabBar from './WorkspaceTabBar';
import InvestigationCanvasPlaceholder from './InvestigationCanvasPlaceholder';
import ArchiveTray from './ArchiveTray';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ReopenToast from './ReopenToast';

import { persistenceAdapter } from '@/shared/lib/persistence';
import { 
  subscribe,
  unsubscribe,
  INVESTIGATION_CREATED, 
  INVESTIGATION_RENAMED, 
  INVESTIGATION_ARCHIVED, 
  INVESTIGATION_RESTORED, 
  INVESTIGATION_DELETED 
} from '@/shared/lib/events';
import { 
  createInvestigationCommand, 
  archiveInvestigationCommand, 
  deleteInvestigationCommand, 
  restoreInvestigationCommand, 
  renameInvestigationCommand 
} from '../lib/investigationCommands';

export default function InvestigationWorkspace({ className }) {
  const [investigations, setInvestigations] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  // Initial load and event subscriptions
  const refresh = () => {
    const all = persistenceAdapter.loadAllInvestigations();
    setInvestigations(all.filter(i => i.status !== 'Deleted'));
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();

    subscribe(INVESTIGATION_CREATED, handleUpdate);
    subscribe(INVESTIGATION_RENAMED, handleUpdate);
    subscribe(INVESTIGATION_ARCHIVED, handleUpdate);
    subscribe(INVESTIGATION_RESTORED, handleUpdate);
    subscribe(INVESTIGATION_DELETED, handleUpdate);

    return () => {
      unsubscribe(INVESTIGATION_CREATED, handleUpdate);
      unsubscribe(INVESTIGATION_RENAMED, handleUpdate);
      unsubscribe(INVESTIGATION_ARCHIVED, handleUpdate);
      unsubscribe(INVESTIGATION_RESTORED, handleUpdate);
      unsubscribe(INVESTIGATION_DELETED, handleUpdate);
    };
  }, []);

  const activeInvestigations = investigations.filter(i => !i.archived);
  const archivedInvestigations = investigations.filter(i => i.archived);

  // Manage active tab
  useEffect(() => {
    if (activeTabId && !activeInvestigations.find(i => i.id === activeTabId)) {
      setActiveTabId(activeInvestigations[0]?.id || null);
    } else if (!activeTabId && activeInvestigations.length > 0) {
      setActiveTabId(activeInvestigations[0].id);
    }
  }, [activeInvestigations, activeTabId]);

  const handleCreate = () => {
    const id = crypto.randomUUID();
    createInvestigationCommand({ id, title: 'New Investigation' });
    setActiveTabId(id);
  };

  const handleRename = (id, newTitle) => {
    renameInvestigationCommand(id, newTitle);
  };

  const handleArchive = (id) => {
    archiveInvestigationCommand(id);
  };

  const handleRestore = (id) => {
    restoreInvestigationCommand(id);
    setActiveTabId(id);
  };

  const handleDeleteRequest = (id) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      deleteInvestigationCommand(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };

  return (
    <GlassPanel className={cn('flex flex-col h-full w-full overflow-hidden', className)}>
      <WorkspaceTabBar 
        investigations={activeInvestigations}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onCreate={handleCreate}
        onRename={handleRename}
        onArchive={handleArchive}
      />
      <div className="flex-1 relative flex">
        <InvestigationCanvasPlaceholder />
        <ArchiveTray 
          archivedInvestigations={archivedInvestigations}
          onRestore={handleRestore}
          onDelete={handleDeleteRequest}
        />
        {deleteConfirmationId && (
          <DeleteConfirmationDialog 
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        )}
        <ReopenToast />
      </div>
    </GlassPanel>
  );
}
