#!/usr/bin/env node
/**
 * Exxat DS image IA gate — Cursor beforeSubmitPrompt hook.
 *
 * When the user attaches a screenshot/mockup, record a short-lived flag so
 * exxat-brief-gate can escalate the brief + IA-only reminder on the next
 * design-critical write. Does NOT block submission (continue: true).
 */

"use strict"

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|bmp|svg)$/i

const BUILD_VERBS =
  /\b(build|rebuild|redesign|match|make it like|implement|create|recreate|copy|pixel)\b/i

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function flagPath(cwd) {
  return resolve(cwd, ".cursor", ".exxat-ds-image-prompt.json")
}

function writeFlag(cwd, payload) {
  const dir = dirname(flagPath(cwd))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(flagPath(cwd), JSON.stringify(payload, null, 2) + "\n", "utf8")
}

function clearFlag(cwd) {
  try {
    unlinkSync(flagPath(cwd))
  } catch {
    /* absent */
  }
}

function hasImageAttachment(attachments) {
  if (!Array.isArray(attachments)) return false
  return attachments.some(att => {
    const path = typeof att?.file_path === "string" ? att.file_path : ""
    return IMAGE_EXT.test(path)
  })
}

let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", chunk => {
  stdin += chunk
})
process.stdin.on("end", () => {
  let input
  try {
    input = JSON.parse(stdin || "{}")
  } catch {
    emit({ continue: true })
    return
  }

  const cwd = typeof input.cwd === "string" && input.cwd.length > 0 ? input.cwd : process.cwd()
  const prompt = typeof input.prompt === "string" ? input.prompt : ""
  const attachments = input.attachments

  if (hasImageAttachment(attachments)) {
    writeFlag(cwd, {
      at: new Date().toISOString(),
      reason: "image_attachment",
      promptPreview: prompt.slice(0, 240),
    })
  } else if (BUILD_VERBS.test(prompt) && Array.isArray(attachments) && attachments.length > 0) {
    writeFlag(cwd, {
      at: new Date().toISOString(),
      reason: "attachment_with_build_intent",
      promptPreview: prompt.slice(0, 240),
    })
  } else {
    clearFlag(cwd)
  }

  emit({ continue: true })
})
