import type { Evaluation, MappingRow, Person, Skill, Submission, V2State } from "./types"

/**
 * One index per list, built on first read and kept for as long as that list object lives. State transitions return new arrays, so a
 * WeakMap keyed on the array invalidates for free and never serves stale rows. Every selector that used to filter a whole list per
 * student or per skill reads here instead (dataset spec section 7.4, strategy 05 section 9). Row order inside a bucket is the list's order.
 * Lists must not be mutated in place after the first read.
 */

const EMPTY: readonly never[] = []

interface EvalIndex {
  byId: Map<string, Evaluation>
  byStudent: Map<string, Evaluation[]>
  bySkill: Map<string, Evaluation[]>
  byStudentSkill: Map<string, Evaluation[]>
}

const evalIndexes = new WeakMap<Evaluation[], EvalIndex>()

function push<T>(m: Map<string, T[]>, k: string, v: T) {
  const a = m.get(k)
  if (a) a.push(v)
  else m.set(k, [v])
}

function evalIndex(list: Evaluation[]): EvalIndex {
  let ix = evalIndexes.get(list)
  if (!ix) {
    ix = { byId: new Map(), byStudent: new Map(), bySkill: new Map(), byStudentSkill: new Map() }
    for (const e of list) {
      if (!ix.byId.has(e.id)) ix.byId.set(e.id, e)
      push(ix.byStudent, e.studentId, e)
      push(ix.bySkill, e.skillId, e)
      push(ix.byStudentSkill, `${e.studentId}|${e.skillId}`, e)
    }
    evalIndexes.set(list, ix)
  }
  return ix
}

export const evaluationById = (s: V2State, id: string): Evaluation | undefined => evalIndex(s.evaluations).byId.get(id)
export const evalsOfStudent = (s: V2State, studentId: string): readonly Evaluation[] => evalIndex(s.evaluations).byStudent.get(studentId) ?? EMPTY
export const evalsOfSkill = (s: V2State, skillId: string): readonly Evaluation[] => evalIndex(s.evaluations).bySkill.get(skillId) ?? EMPTY
export const evalsOfStudentSkill = (s: V2State, studentId: string, skillId: string): readonly Evaluation[] => evalIndex(s.evaluations).byStudentSkill.get(`${studentId}|${skillId}`) ?? EMPTY

interface SubIndex {
  byId: Map<string, Submission>
  byStudent: Map<string, Submission[]>
}
const subIndexes = new WeakMap<Submission[], SubIndex>()
function subIndex(list: Submission[]): SubIndex {
  let ix = subIndexes.get(list)
  if (!ix) {
    ix = { byId: new Map(), byStudent: new Map() }
    for (const x of list) {
      if (!ix.byId.has(x.id)) ix.byId.set(x.id, x)
      push(ix.byStudent, x.studentId, x)
    }
    subIndexes.set(list, ix)
  }
  return ix
}
export const submissionById = (s: V2State, id: string): Submission | undefined => subIndex(s.submissions).byId.get(id)
export const submissionsOfStudent = (s: V2State, studentId: string): readonly Submission[] => subIndex(s.submissions).byStudent.get(studentId) ?? EMPTY

const skillIndexes = new WeakMap<Skill[], Map<string, Skill>>()
export function skillById(s: V2State, id: string): Skill | undefined {
  let m = skillIndexes.get(s.skills)
  if (!m) {
    m = new Map()
    for (const k of s.skills) if (!m.has(k.id)) m.set(k.id, k)
    skillIndexes.set(s.skills, m)
  }
  return m.get(id)
}

const personIndexes = new WeakMap<Person[], Map<string, Person>>()
export function personById(s: V2State, id: string): Person | undefined {
  let m = personIndexes.get(s.people)
  if (!m) {
    m = new Map()
    for (const p of s.people) if (!m.has(p.id)) m.set(p.id, p)
    personIndexes.set(s.people, m)
  }
  return m.get(id)
}

const mappingIndexes = new WeakMap<MappingRow[], Map<string, MappingRow[]>>()
/** The mapping rows of one course, in list order. */
export function mappingsOfCourse(s: V2State, courseId: string): readonly MappingRow[] {
  let m = mappingIndexes.get(s.mappings)
  if (!m) {
    m = new Map()
    for (const r of s.mappings) push(m, r.courseId, r)
    mappingIndexes.set(s.mappings, m)
  }
  return m.get(courseId) ?? EMPTY
}
