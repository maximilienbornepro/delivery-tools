import { PROJECTS, ALL_PROJECTS, CHRONOLOGICAL, type ProjectSelection } from '../types';

interface ProjectSelectorProps {
  selected: ProjectSelection;
  onChange: (project: ProjectSelection) => void;
}

export function ProjectSelector({ selected, onChange }: ProjectSelectorProps) {
  return (
    <select
      className="project-selector"
      value={selected}
      onChange={(e) => onChange(e.target.value as ProjectSelection)}
    >
      <option value={ALL_PROJECTS}>Tous les projets</option>
      <option value={CHRONOLOGICAL}>Chronologie</option>
      {PROJECTS.map((project) => (
        <option key={project} value={project}>
          {project}
        </option>
      ))}
    </select>
  );
}
