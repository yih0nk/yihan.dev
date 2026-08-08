import ProjectsSpread from '@/components/projects/ProjectsSpread'

/**
 * Preview of the editorial-spread alternative to the projects index.
 *
 * Rendered under the real nav and footer rather than in a fixed overlay — the
 * last prototype was previewed in a `fixed inset-0` layer, which meant nobody
 * saw it under the chrome until the day it was promoted and its top padding
 * turned out to clear nothing. `/preview` is noindex via its layout.
 */
export default function PreviewProjectsSpreadPage() {
  return <ProjectsSpread />
}
