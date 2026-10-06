// Separates what is study from what is not, when a personal planner is brought into the
// Study hub. Nothing is thrown away: what is not study is returned separately, to be kept
// aside until it has a home elsewhere in Life OS.
const list = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

export function splitStudy({ plan, state, modules }, { lifeGroups = [], studyRuleCategories = ['study', 'class', 'exam', 'project'] } = {}) {
  const life = new Set(lifeGroups.map((name) => name.toLowerCase()))
  const isLife = (group) => life.has(String(group ?? '').toLowerCase())
  const studyCategory = new Set(studyRuleCategories)
  const overlays = plain(state.cards)
  const groupOf = (card) => overlays[card.id]?.edits?.moduleGroup ?? overlays[card.id]?.edits?.module ?? card.moduleGroup ?? card.module ?? ''

  const keptModules = list(modules).filter((module) => !isLife(module.moduleGroup))
  const keptModuleIds = new Set(keptModules.map((module) => module.id))
  const baseCards = list(plan.baseCards).filter((card) => !isLife(groupOf(card)))
  const addedCards = list(state.addedCards).filter((card) => !isLife(groupOf(card)))
  const asideBase = list(plan.baseCards).filter((card) => isLife(groupOf(card)))
  const asideAdded = list(state.addedCards).filter((card) => isLife(groupOf(card)))
  const asideIds = new Set([...asideBase, ...asideAdded].map((card) => card.id))

  const studyRule = (rule) => studyCategory.has(rule.category) && !isLife(rule.moduleGroup)
  const scheduleRules = list(plan.scheduleRules).filter(studyRule)
  const keptRuleIds = new Set(scheduleRules.map((rule) => rule.id))
  const scheduleExceptions = list(plan.scheduleExceptions).map((exception) => ({
    ...exception,
    removeRuleIds: list(exception.removeRuleIds).filter((id) => keptRuleIds.has(id)),
    blocks: list(exception.blocks).filter(studyRule),
  })).filter((exception) => exception.removeRuleIds.length || exception.blocks.length)

  const knowledgeSeeds = list(plan.knowledgeSeeds).filter((note) => !note.moduleId || keptModuleIds.has(note.moduleId))
  const keptGroups = new Set(keptModules.map((module) => module.moduleGroup))

  return {
    modules: keptModules,
    plan: {
      ...plan,
      baseCards,
      scheduleRules,
      scheduleExceptions,
      knowledgeSeeds,
      options: { ...plain(plan.options), modules: list(plan.options?.modules).filter((name) => keptGroups.has(name)) },
    },
    state: {
      ...state,
      addedCards,
      cards: Object.fromEntries(Object.entries(overlays).filter(([id]) => !asideIds.has(id))),
      shoppingList: [],
      settings: { ...plain(state.settings), customModules: list(state.settings?.customModules).filter((name) => !isLife(name)) },
    },
    setAside: {
      why: 'Not study. Kept until it has a home elsewhere in Life OS.',
      groups: lifeGroups,
      modules: list(modules).filter((module) => isLife(module.moduleGroup)),
      baseCards: asideBase,
      addedCards: asideAdded,
      cardStates: Object.fromEntries(Object.entries(overlays).filter(([id]) => asideIds.has(id))),
      scheduleRules: list(plan.scheduleRules).filter((rule) => !studyRule(rule)),
      scheduleExceptions: list(plan.scheduleExceptions),
      knowledgeSeeds: list(plan.knowledgeSeeds).filter((note) => note.moduleId && !keptModuleIds.has(note.moduleId)),
      shoppingList: list(state.shoppingList),
    },
  }
}
