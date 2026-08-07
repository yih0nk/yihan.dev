import ProjectsIndexPrototype from '@/components/projects/ProjectsIndexPrototype'
import { COLORS } from '@/styles/tokens'

/** Toolbar-free preview of the projects index prototype. */
export default function PreviewProjectsPage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ background: COLORS.bg }}>
      <ProjectsIndexPrototype />
    </div>
  )
}
