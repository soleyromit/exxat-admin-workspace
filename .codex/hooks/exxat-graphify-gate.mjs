#!/usr/bin/env node
/**
 * Exxat DS Graphify gate — Cursor/Claude preToolUse hook.
 *
 * Prose rules were not enough. graphify.mdc stays alwaysApply: false because
 * the repo caps always-on rules at five; the constitution one-liner was
 * skipped because `graphify-out/` is gitignored and Glob reports "0 files".
 *
 * This hook is the floor, same pattern as brief-gate:
 *   - If graphify-out/graph.json exists and the agent is about to Grep / Glob
 *     / Task-explore / SemanticSearch, inject a reminder to query Graphify
 *     first via Shell.
 *   - Never blocks (permission: allow). Failures fall through to allow.
 *
 * Claude Code PreToolUse uses hookSpecificOutput.additionalContext.
 * Cursor preToolUse uses agent_message.
 */

"use strict"

import { existsSync } from "node:fs"
import { resolve } from "node:path"

const SEARCH_TOOLS =
  /^(Grep|Glob|Task|SemanticSearch|Agent|grep|glob|task|semantic_search|codebase_search)$/i

const GRAPHIFY_REMINDER =
  `[exxat-graphify-gate] Knowledge graph is local at graphify-out/ (gitignored; Glob will not see it).\n` +
  `For architecture, dependency, impact, ownership, or broad where/how questions:\n` +
  `  1. Shell: graphify query "<question>" --budget 1200\n` +
  `  2. Read only the source files Graphify returns.\n` +
  `Do not Glob graphify-out/. Do not read GRAPH_REPORT.md in full. Do not launch explore agents first.`

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function allowCursor(message) {
  if (message) emit({ permission: "allow", agent_message: message })
  emit({ permission: "allow" })
}

function allowClaude(message) {
  if (message) {
    emit({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: message,
      },
    })
  }
  emit({})
}

function graphExists(cwd) {
  return existsSync(resolve(cwd, "graphify-out", "graph.json"))
}

function isClaudePayload(input) {
  return typeof input.hook_event_name === "string"
}

function toolName(input) {
  const raw = input.tool_name ?? input.toolName ?? input.tool ?? ""
  return typeof raw === "string" ? raw : ""
}

function alreadyUsingGraphify(input) {
  const toolInput = input.tool_input ?? input.toolInput ?? {}
  const command = typeof toolInput.command === "string" ? toolInput.command : ""
  const prompt = typeof toolInput.prompt === "string" ? toolInput.prompt : ""
  const blob = `${command} ${prompt}`.toLowerCase()
  return blob.includes("graphify")
}

let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => {
  stdin += chunk
})
process.stdin.on("end", () => {
  let input
  try {
    input = JSON.parse(stdin || "{}")
  } catch {
    emit({ permission: "allow" })
    return
  }

  const cwd =
    typeof input.cwd === "string" && input.cwd.length > 0
      ? input.cwd
      : typeof input.workspace_roots?.[0] === "string"
        ? input.workspace_roots[0]
        : process.cwd()

  const claude = isClaudePayload(input)
  const allow = claude ? allowClaude : allowCursor

  if (!graphExists(cwd)) {
    allow()
    return
  }

  if (alreadyUsingGraphify(input)) {
    allow()
    return
  }

  const name = toolName(input)
  if (!SEARCH_TOOLS.test(name)) {
    allow()
    return
  }

  allow(GRAPHIFY_REMINDER)
})
