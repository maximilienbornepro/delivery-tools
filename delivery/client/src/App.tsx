import { useState, useEffect, useMemo, useCallback } from 'react';
import { BoardDelivery } from './components/BoardDelivery';
import { BoardDeliveryAll } from './components/BoardDeliveryAll';
import { BoardDeliveryChronological } from './components/BoardDeliveryChronological';
import { ConfidenceIndex } from './components/ConfidenceIndex';
import { ReleaseBoard } from './components/ReleaseBoard';
import { RestoreModal } from './components/RestoreModal';
import { BurgerMenu, generatePIs2026 } from './components/BurgerMenu';
import { ProjectSelector } from './components/ProjectSelector';
import { fetchJiraIssues } from './services/jiraService';
import { saveTaskPosition, getTaskPositions } from './services/positionsService';
import { fetchVersionsByDateRange } from './services/mepService';
import {
  fetchConfidenceData,
  updateConfidenceScore,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addImprovement,
  updateImprovement,
  deleteImprovement,
} from './services/confidenceService';
import {
  fetchPIState,
  toggleFreeze,
  hideTask,
  restoreTasks,
} from './services/piStateService';
import type { Task, Release, ConfidenceData, PIState, ProjectKey, ProjectSelection } from './types';
import { PROJECTS, ALL_PROJECTS, CHRONOLOGICAL } from './types';
import './App.css';

const defaultConfidenceData: ConfidenceData = {
  piId: '',
  projectId: 'TVSMART',
  score: 3.0,
  questions: [],
  improvements: [],
};

// Read initial values from URL
function getInitialStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const projectParam = params.get('project');
  const piParam = params.get('pi');

  let project: ProjectSelection = 'TVSMART';
  if (projectParam === ALL_PROJECTS) {
    project = ALL_PROJECTS;
  } else if (projectParam === CHRONOLOGICAL) {
    project = CHRONOLOGICAL;
  } else if (projectParam && PROJECTS.includes(projectParam as ProjectKey)) {
    project = projectParam as ProjectKey;
  }
  const pi = piParam || 'pi1';

  return { project, pi };
}

// Update URL without reload
function updateURL(project: ProjectSelection, pi: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('project', project);
  url.searchParams.set('pi', pi);
  window.history.replaceState({}, '', url.toString());
}

function App() {
  const initialState = getInitialStateFromURL();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjectsTasks, setAllProjectsTasks] = useState<Map<ProjectKey, Task[]>>(new Map());
  const [releases, setReleases] = useState<Release[]>([]);
  const [confidenceData, setConfidenceData] = useState<ConfidenceData>(defaultConfidenceData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPI, setSelectedPI] = useState(initialState.pi);
  const [selectedProject, setSelectedProject] = useState<ProjectSelection>(initialState.project);
  const [piState, setPIState] = useState<PIState | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hideMergeTickets, setHideMergeTickets] = useState(true); // Hide "Merge" tickets by default

  // Check if ALL projects view or Chronological view is active
  const isAllProjectsView = selectedProject === ALL_PROJECTS;
  const isChronologicalView = selectedProject === CHRONOLOGICAL;
  const isCombinedView = isAllProjectsView || isChronologicalView;

  // Projects that support "Merge" ticket filtering
  const mergeFilterProjects: ProjectKey[] = ['TVORA', 'TVSFR'];
  const showMergeToggle = isCombinedView || mergeFilterProjects.includes(selectedProject as ProjectKey);

  // Filter function to remove "Merge" tickets (title format: "TVORA-123 - Merge ...")
  const filterMergeTickets = useCallback((taskList: Task[]): Task[] => {
    if (!hideMergeTickets) return taskList;
    return taskList.filter(task => {
      // Check if title contains "- Merge" or starts with "Merge" after the JIRA key
      const titleLower = task.title.toLowerCase();
      return !titleLower.includes('- merge') && !titleLower.match(/^[a-z]+-\d+\s+merge/i);
    });
  }, [hideMergeTickets]);

  // Update URL when project or PI changes
  useEffect(() => {
    updateURL(selectedProject, selectedPI);
  }, [selectedProject, selectedPI]);

  const piList = useMemo(() => generatePIs2026(), []);

  const currentSprints = useMemo(() => {
    const pi = piList.find((p) => p.id === selectedPI);
    return pi?.sprints || [];
  }, [piList, selectedPI]);

  // Get PI date range for MEP filtering
  const piDateRange = useMemo(() => {
    const pi = piList.find((p) => p.id === selectedPI);
    if (!pi || pi.sprints.length === 0) return null;
    const startDate = pi.sprints[0].startDate;
    const endDate = pi.sprints[pi.sprints.length - 1].endDate;
    return { startDate, endDate };
  }, [piList, selectedPI]);

  // Load versions for the current PI date range
  const loadVersions = useCallback(async () => {
    if (!piDateRange || isCombinedView) {
      setReleases([]);
      return;
    }

    try {
      const versions = await fetchVersionsByDateRange(
        selectedProject as ProjectKey,
        piDateRange.startDate,
        piDateRange.endDate
      );

      // Convert JIRA versions to Release format
      const convertedReleases: Release[] = versions.map((version) => ({
        id: version.id,
        date: version.releaseDate || 'TBD',
        version: version.name,
        issues: version.issues,
      }));

      setReleases(convertedReleases);
    } catch (err) {
      console.error('Failed to load versions:', err);
      // Keep existing releases on error
    }
  }, [piDateRange, selectedProject, isCombinedView]);

  // Load PI state (freeze status + hidden keys)
  const loadPIState = useCallback(async () => {
    if (isCombinedView) {
      setPIState(null);
      return;
    }

    try {
      const state = await fetchPIState(selectedProject as ProjectKey, selectedPI);
      setPIState(state);
    } catch (err) {
      console.error('Failed to load PI state:', err);
      setPIState({ piId: selectedPI, projectId: selectedProject as ProjectKey, isFrozen: false, hiddenJiraKeys: [], frozenAt: null });
    }
  }, [selectedPI, selectedProject, isCombinedView]);

  useEffect(() => {
    loadPIState();
  }, [loadPIState]);

  // Track if initial load has been done for current project/PI
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Reset initial load flag when project or PI changes
  useEffect(() => {
    setInitialLoadDone(false);
  }, [selectedProject, selectedPI]);

  // Load issues for ALL projects view
  const loadAllProjectsIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const projectTasksMap = new Map<ProjectKey, Task[]>();

      // Load tasks from all projects in parallel
      const results = await Promise.all(
        PROJECTS.map(async (projectId) => {
          try {
            const data = await fetchJiraIssues(projectId);

            // Fetch PI state to get hidden tasks for this project
            let hiddenKeys = new Set<string>();
            try {
              const projectPiState = await fetchPIState(projectId, selectedPI);
              hiddenKeys = new Set(projectPiState.hiddenJiraKeys || []);
            } catch {
              // Ignore PI state errors
            }

            // Filter out hidden tasks
            const visibleJiraTasks = data.tasks.filter(task => !hiddenKeys.has(task.jiraKey));

            let positions: { taskId: string; startCol: number; endCol: number; row: number }[] = [];
            try {
              positions = await getTaskPositions(projectId, selectedPI);
            } catch {
              // Ignore position errors
            }

            const positionMap = new Map(positions.map((p) => [p.taskId, p]));

            const transformedTasks: Task[] = visibleJiraTasks.map((jiraTask, index) => {
              const savedPosition = positionMap.get(jiraTask.id);
              const defaultCol = (index % 3) * 2;
              const defaultRow = Math.floor(index / 3);

              return {
                id: jiraTask.id,
                title: jiraTask.title,
                platform: 'SMARTTV' as const,
                sprintId: 's1',
                type: jiraTask.type,
                status: jiraTask.status,
                startCol: savedPosition?.startCol ?? defaultCol,
                endCol: savedPosition?.endCol ?? defaultCol + 2,
                row: savedPosition?.row ?? defaultRow,
                jiraKey: jiraTask.jiraKey,
                jiraStatus: jiraTask.jiraStatus,
                storyPoints: jiraTask.storyPoints,
                assignee: jiraTask.assignee,
                assigneeAvatar: jiraTask.assigneeAvatar,
                priority: jiraTask.priority,
                fixVersion: jiraTask.fixVersion,
                estimatedDays: jiraTask.estimatedDays,
              };
            });

            return { projectId, tasks: transformedTasks };
          } catch (err) {
            console.error(`Failed to load tasks for ${projectId}:`, err);
            return { projectId, tasks: [] };
          }
        })
      );

      results.forEach(({ projectId, tasks }) => {
        projectTasksMap.set(projectId, tasks);
      });

      setAllProjectsTasks(projectTasksMap);
      setInitialLoadDone(true);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to load ALL projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPI]);

  const loadJiraIssues = useCallback(async (forceLoad = false) => {
    // For ALL view, use separate loader
    if (isCombinedView) {
      await loadAllProjectsIssues();
      return;
    }

    // Wait for piState to be loaded before fetching (to know hidden tickets)
    if (piState === null) {
      console.log('Waiting for PI state to load...');
      return;
    }

    // Block manual refresh if PI is frozen (but allow initial load)
    if (piState.isFrozen && initialLoadDone && !forceLoad) {
      console.log('PI is frozen, manual refresh disabled');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJiraIssues(selectedProject as ProjectKey);

      // Filter out hidden tickets
      const hiddenKeys = new Set(piState.hiddenJiraKeys || []);
      const visibleJiraTasks = data.tasks.filter(task => !hiddenKeys.has(task.jiraKey));

      // Try to get saved positions, fallback to empty array if DB not available
      let positions: { taskId: string; startCol: number; endCol: number; row: number }[] = [];
      try {
        console.log('Loading positions for project:', selectedProject, 'PI:', selectedPI);
        positions = await getTaskPositions(selectedProject as ProjectKey, selectedPI);
        console.log('Loaded positions from DB:', positions);
      } catch (e) {
        console.log('Database not available, using default positions:', e);
      }

      // Create a map of positions by taskId
      const positionMap = new Map(positions.map((p) => [p.taskId, p]));

      // Transform JIRA tasks to our Task type with default grid layout
      const transformedTasks: Task[] = visibleJiraTasks.map((jiraTask, index) => {
        const savedPosition = positionMap.get(jiraTask.id);

        // Default: 3 tasks per row, each task spans 2 columns
        const defaultCol = (index % 3) * 2;
        const defaultRow = Math.floor(index / 3);

        return {
          id: jiraTask.id,
          title: jiraTask.title,
          platform: 'SMARTTV' as const,
          sprintId: 's1',
          type: jiraTask.type,
          status: jiraTask.status,
          startCol: savedPosition?.startCol ?? defaultCol,
          endCol: savedPosition?.endCol ?? defaultCol + 2,
          row: savedPosition?.row ?? defaultRow,
          jiraKey: jiraTask.jiraKey,
          jiraStatus: jiraTask.jiraStatus,
          storyPoints: jiraTask.storyPoints,
          assignee: jiraTask.assignee,
          assigneeAvatar: jiraTask.assigneeAvatar,
          priority: jiraTask.priority,
          fixVersion: jiraTask.fixVersion,
                estimatedDays: jiraTask.estimatedDays,
        };
      });

      // If frozen or initial load: REPLACE tasks (show exactly what's filtered)
      // If not frozen and already loaded: MERGE (add new, keep existing)
      if (piState.isFrozen || !initialLoadDone) {
        setTasks(transformedTasks);
      } else {
        // MERGE logic: keep existing tasks + add new ones (never remove)
        setTasks((prevTasks) => {
          const existingIds = new Set(prevTasks.map((t) => t.id));
          const newTasks = transformedTasks.filter((t) => !existingIds.has(t.id));

          if (newTasks.length > 0) {
            console.log('Adding', newTasks.length, 'new tasks');
          }

          return [...prevTasks, ...newTasks];
        });
      }

      setInitialLoadDone(true);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to load JIRA issues:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPI, selectedProject, piState, initialLoadDone, isCombinedView, loadAllProjectsIssues]);

  useEffect(() => {
    loadJiraIssues();
  }, [loadJiraIssues]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Load confidence data for the current project + PI
  const loadConfidenceData = useCallback(async () => {
    if (isCombinedView) {
      setConfidenceData(defaultConfidenceData);
      return;
    }

    try {
      const data = await fetchConfidenceData(selectedProject as ProjectKey, selectedPI);
      setConfidenceData(data);
    } catch (err) {
      console.error('Failed to load confidence data:', err);
      setConfidenceData({ ...defaultConfidenceData, piId: selectedPI, projectId: selectedProject as ProjectKey });
    }
  }, [selectedPI, selectedProject, isCombinedView]);

  useEffect(() => {
    loadConfidenceData();
  }, [loadConfidenceData]);

  // Reset tasks when switching project
  useEffect(() => {
    setTasks([]);
  }, [selectedProject]);

  // Confidence handlers
  const handleScoreChange = async (score: number) => {
    if (isCombinedView) return;
    try {
      await updateConfidenceScore(selectedProject as ProjectKey, selectedPI, score);
      setConfidenceData((prev) => ({ ...prev, score }));
    } catch (err) {
      console.error('Failed to update score:', err);
    }
  };

  const handleAddQuestion = async (label: string) => {
    if (isCombinedView) return;
    try {
      const newQuestion = await addQuestion(selectedProject as ProjectKey, selectedPI, label);
      setConfidenceData((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleUpdateQuestion = async (id: number, label: string) => {
    try {
      await updateQuestion(id, label);
      setConfidenceData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, label } : q
        ),
      }));
    } catch (err) {
      console.error('Failed to update question:', err);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await deleteQuestion(id);
      setConfidenceData((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleAddImprovement = async (label: string) => {
    if (isCombinedView) return;
    try {
      const newImprovement = await addImprovement(selectedProject as ProjectKey, selectedPI, label);
      setConfidenceData((prev) => ({
        ...prev,
        improvements: [...prev.improvements, newImprovement],
      }));
    } catch (err) {
      console.error('Failed to add improvement:', err);
    }
  };

  const handleUpdateImprovement = async (id: number, label: string) => {
    try {
      await updateImprovement(id, label);
      setConfidenceData((prev) => ({
        ...prev,
        improvements: prev.improvements.map((i) =>
          i.id === id ? { ...i, label } : i
        ),
      }));
    } catch (err) {
      console.error('Failed to update improvement:', err);
    }
  };

  const handleDeleteImprovement = async (id: number) => {
    try {
      await deleteImprovement(id);
      setConfidenceData((prev) => ({
        ...prev,
        improvements: prev.improvements.filter((i) => i.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete improvement:', err);
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const handleTaskDelete = async (taskId: string) => {
    if (isCombinedView) return;
    const task = tasks.find((t) => t.id === taskId);

    // If task has a jiraKey, hide it in the PI state
    if (task?.jiraKey) {
      try {
        const result = await hideTask(selectedProject as ProjectKey, selectedPI, task.jiraKey, task.title);
        setPIState((prev) =>
          prev ? { ...prev, hiddenTasks: result.hiddenTasks, hiddenJiraKeys: result.hiddenTasks.map(t => t.jiraKey) } : prev
        );
      } catch (err) {
        console.error('Failed to hide task:', err);
      }
    }

    // Remove from local state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Handle freeze toggle
  const handleToggleFreeze = async () => {
    if (isCombinedView) return;
    try {
      const newState = await toggleFreeze(selectedProject as ProjectKey, selectedPI);
      setPIState(newState);
    } catch (err) {
      console.error('Failed to toggle freeze:', err);
    }
  };

  // Handle restore tasks
  const handleRestoreTasks = async (jiraKeys: string[]) => {
    if (isCombinedView) return;
    try {
      const result = await restoreTasks(selectedProject as ProjectKey, selectedPI, jiraKeys);
      setPIState((prev) =>
        prev ? { ...prev, hiddenTasks: result.hiddenTasks, hiddenJiraKeys: result.hiddenTasks.map(t => t.jiraKey) } : prev
      );
      setShowRestoreModal(false);
      // Refresh to get restored tickets
      await loadJiraIssues();
    } catch (err) {
      console.error('Failed to restore tasks:', err);
    }
  };

  const handleTaskResize = async (taskId: string, newStartCol: number, newEndCol: number) => {
    if (isCombinedView) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, startCol: newStartCol, endCol: newEndCol }
          : t
      )
    );

    // Save to database
    try {
      await saveTaskPosition({
        taskId,
        piId: selectedPI,
        projectId: selectedProject as ProjectKey,
        startCol: newStartCol,
        endCol: newEndCol,
        row: task.row ?? 0,
      });
    } catch (err) {
      console.error('Failed to save position:', err);
    }
  };

  const handleTaskMove = async (taskId: string, newStartCol: number, newRow: number) => {
    if (isCombinedView) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const taskWidth = (task.endCol ?? 1) - (task.startCol ?? 0);
    const newEndCol = newStartCol + taskWidth;

    console.log('Moving task:', taskId, 'to col:', newStartCol, 'row:', newRow);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          startCol: newStartCol,
          endCol: newEndCol,
          row: newRow,
        };
      })
    );

    // Save to database
    try {
      console.log('Saving position to DB:', { taskId, piId: selectedPI, projectId: selectedProject, startCol: newStartCol, endCol: newEndCol, row: newRow });
      await saveTaskPosition({
        taskId,
        piId: selectedPI,
        projectId: selectedProject as ProjectKey,
        startCol: newStartCol,
        endCol: newEndCol,
        row: newRow,
      });
      console.log('Position saved successfully');
    } catch (err) {
      console.error('Failed to save position:', err);
    }
  };

  const selectedPIName = piList.find((p) => p.id === selectedPI)?.name || '';

  // Prepare data for ALL projects view (with Merge filter for TVORA/TVSFR)
  const allProjectsTasksArray = useMemo(() => {
    return Array.from(allProjectsTasks.entries()).map(([projectId, projectTasks]) => ({
      projectId,
      tasks: mergeFilterProjects.includes(projectId) ? filterMergeTickets(projectTasks) : projectTasks,
    }));
  }, [allProjectsTasks, filterMergeTickets]);

  // Filter tasks for single project view (apply Merge filter for TVORA/TVSFR)
  const filteredTasks = useMemo(() => {
    if (mergeFilterProjects.includes(selectedProject as ProjectKey)) {
      return filterMergeTickets(tasks);
    }
    return tasks;
  }, [tasks, selectedProject, filterMergeTickets]);

  // Calculate total task count (with Merge filter applied)
  const totalTaskCount = isCombinedView
    ? allProjectsTasksArray.reduce((sum, { tasks: t }) => sum + t.length, 0)
    : filteredTasks.length;

  return (
    <div className="app">
      <BurgerMenu
        selectedPI={selectedPI}
        onSelectPI={setSelectedPI}
        piList={piList}
      />

      <div className="toolbar">
        <span className="pi-indicator">
          {selectedPIName}
          {!isCombinedView && piState?.isFrozen && <span className="frozen-badge">Fige</span>}
        </span>

        {!isCombinedView && (
          <>
            <button
              className={`freeze-btn ${piState?.isFrozen ? 'frozen' : ''}`}
              onClick={handleToggleFreeze}
              title={piState?.isFrozen ? 'Defiger le PI' : 'Figer le PI'}
            >
              {piState?.isFrozen ? 'Defiger' : 'Figer'}
            </button>

            <button
              className="refresh-btn"
              onClick={() => loadJiraIssues()}
              disabled={isLoading || piState?.isFrozen}
            >
              {isLoading ? 'Chargement...' : 'Rafraichir JIRA'}
            </button>

            {piState?.hiddenJiraKeys && piState.hiddenJiraKeys.length > 0 && (
              <button
                className="restore-btn"
                onClick={() => setShowRestoreModal(true)}
              >
                Restaurer ({piState.hiddenJiraKeys.length})
              </button>
            )}
          </>
        )}

        {showMergeToggle && (
          <label className="merge-toggle">
            <span className="merge-toggle-label">Merge</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={!hideMergeTickets}
                onChange={() => setHideMergeTickets(!hideMergeTickets)}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>
        )}

        {error && <span className="error-msg">Erreur: {error}</span>}
        <span className="task-count">
          {totalTaskCount} tickets {isChronologicalView ? '(chrono)' : isAllProjectsView ? '(tous)' : selectedProject}
        </span>

        <div className="project-selector-wrapper">
          <ProjectSelector
            selected={selectedProject}
            onChange={setSelectedProject}
          />
        </div>
      </div>

      <main className="main-content">
        <div className="board-section">
          {isChronologicalView ? (
            <BoardDeliveryChronological
              sprints={currentSprints}
              projectTasks={allProjectsTasksArray}
            />
          ) : isAllProjectsView ? (
            <BoardDeliveryAll
              sprints={currentSprints}
              projectTasks={allProjectsTasksArray}
            />
          ) : (
            <BoardDelivery
              sprints={currentSprints}
              tasks={filteredTasks}
              releases={releases}
              projectLabel={selectedProject}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskResize={handleTaskResize}
              onTaskMove={handleTaskMove}
            />
          )}
        </div>

        {!isCombinedView && (
          <div className="bottom-panels">
            <div className="confidence-section">
              <ConfidenceIndex
                data={confidenceData}
                onScoreChange={handleScoreChange}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onAddImprovement={handleAddImprovement}
                onUpdateImprovement={handleUpdateImprovement}
                onDeleteImprovement={handleDeleteImprovement}
              />
            </div>

            <div className="release-section">
              <ReleaseBoard releases={releases} />
            </div>
          </div>
        )}
      </main>

      {showRestoreModal && piState?.hiddenTasks && piState.hiddenTasks.length > 0 && (
        <RestoreModal
          hiddenTasks={piState.hiddenTasks}
          onRestore={handleRestoreTasks}
          onClose={() => setShowRestoreModal(false)}
        />
      )}
    </div>
  );
}

export default App;
