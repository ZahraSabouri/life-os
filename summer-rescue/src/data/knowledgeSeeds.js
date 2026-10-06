// Notes that came with the open semester's plan.
//
// They are read-only defaults: the moment a note is edited in the app a full copy is saved
// under the same id and takes over. Review history is keyed by id and survives either way.
// See src/utils/knowledge.js. A new semester has none.
import { openSemester } from '../hub/session.js'

const session = openSemester()

export const KNOWLEDGE_SEEDS = Array.isArray(session.plan?.knowledgeSeeds) ? session.plan.knowledgeSeeds : []

export function seedsForModule(moduleId) {
  return KNOWLEDGE_SEEDS.filter((note) => note.moduleId === moduleId)
}
