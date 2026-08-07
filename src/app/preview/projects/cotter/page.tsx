import CaseStudyPrototype from '@/components/projects/CaseStudyPrototype'
import { COLORS } from '@/styles/tokens'

/** Toolbar-free preview of the case-study detail prototype. */
export default function PreviewCaseStudyPage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ background: COLORS.bg }}>
      <CaseStudyPrototype />
    </div>
  )
}
