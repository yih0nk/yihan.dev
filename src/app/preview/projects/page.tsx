import ProjectsIndexPrototype from '@/components/projects/ProjectsIndexPrototype'

/** Toolbar-free preview of the projects index prototype. */
export default function PreviewProjectsPage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ background: '#f7f8f9' }}>
      <ProjectsIndexPrototype />
    </div>
  )
}
