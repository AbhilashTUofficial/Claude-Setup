#!/usr/bin/env node
/**
 * Scaffold a research workspace for the Multi-AI Research Orchestrator skill.
 *
 * Usage:
 *   node scaffold_research.js "<topic>" [--mode Quick|Standard|Deep] [--base DIR] [--force]
 *
 * Creates research/<topic-slug>/ (or <base>/<topic-slug>/) with
 * research-plan.md, agent-assignments.md, disagreements.md, evidence-ledger.md,
 * final-report.md and an empty responses/ folder (per-agent response files are
 * written during Phase 3, not scaffolded up front). Refuses to overwrite an
 * existing project folder unless --force is passed, in which case the whole
 * project folder is removed and recreated from scratch.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SKILL_DIR = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(SKILL_DIR, "assets");

const SUBDIRS = ["responses"];

const LAYOUT = {
  "research-plan.md": "research-plan.md",
  "agent-assignments.md": "agent-assignments.md",
  "disagreements.md": "disagreements.md",
  "evidence-ledger.md": "evidence-ledger.md",
  "final-report.md": "final-report.md",
};

function slugify(topic) {
  const slug = topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) return slug;
  // Topic had no ASCII-slugifiable characters (empty, all-punctuation, or a
  // non-Latin script). Fall back to a short, stable hash of the original text
  // instead of a bare "untitled-research" so two different such topics don't
  // silently collide on the same folder.
  if (!topic.trim()) return "untitled-research";
  const hash = crypto.createHash("sha1").update(topic.trim()).digest("hex").slice(0, 8);
  return `untitled-research-${hash}`;
}

function fill(text, topic, mode) {
  const today = new Date().toISOString().slice(0, 10);
  const replacements = { "{{TOPIC}}": topic, "{{DATE}}": today, "{{MODE}}": mode };
  let out = text;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  return out;
}

function parseArgs(argv) {
  const args = { mode: "Standard", base: "research", force: false, topic: null };
  const positional = [];
  const flagsNeedingValue = { "--mode": "mode", "--base": "base" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a in flagsNeedingValue) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${a} needs a value`);
      }
      args[flagsNeedingValue[a]] = value;
      i++;
    } else if (a === "--force") {
      args.force = true;
    } else if (a === "-h" || a === "--help") {
      args.help = true;
    } else {
      positional.push(a);
    }
  }
  // An unquoted multi-word topic arrives as several positional args; joining
  // them (rather than keeping only the first) is what makes
  // `node scaffold_research.js Veo character consistency` behave the same as
  // the quoted form instead of silently dropping everything after the first word.
  args.topic = positional.length ? positional.join(" ") : null;
  return args;
}

function walk(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    out.push(path.relative(base, full));
    if (entry.isDirectory()) walk(full, base, out);
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${err.message}`);
    return 1;
  }

  if (args.help || !args.topic) {
    console.log(
      'Usage: node scaffold_research.js "<topic>" [--mode Quick|Standard|Deep] [--base DIR] [--force]'
    );
    return args.help ? 0 : 1;
  }
  if (!["Quick", "Standard", "Deep"].includes(args.mode)) {
    console.error(`error: --mode must be one of Quick, Standard, Deep (got "${args.mode}")`);
    return 1;
  }

  const slug = slugify(args.topic);
  const projectDir = path.join(args.base, slug);

  if (fs.existsSync(projectDir) && !args.force) {
    console.error(
      `error: ${projectDir} already exists. Use --force to overwrite, or pick a more ` +
        "specific topic/slug if this is a different project."
    );
    return 1;
  }

  try {
    if (args.force && fs.existsSync(projectDir)) {
      // A real restart, not a merge: clear out any stale responses/ files
      // from a previous run rather than leaving them alongside fresh templates.
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    fs.mkdirSync(projectDir, { recursive: true });
    for (const sub of SUBDIRS) {
      fs.mkdirSync(path.join(projectDir, sub), { recursive: true });
    }

    for (const [templateName, destRel] of Object.entries(LAYOUT)) {
      const src = path.join(TEMPLATES_DIR, templateName);
      if (!fs.existsSync(src)) {
        console.error(`warning: template ${src} missing, skipping`);
        continue;
      }
      const content = fill(fs.readFileSync(src, "utf8"), args.topic, args.mode);
      fs.writeFileSync(path.join(projectDir, destRel), content, "utf8");
    }
  } catch (err) {
    console.error(`error: could not write the project folder (${err.message})`);
    return 1;
  }

  console.log(`Created ${projectDir}`);
  const listing = [];
  walk(projectDir, path.dirname(projectDir), listing);
  for (const p of listing.sort()) console.log(`  ${p}`);
  return 0;
}

process.exit(main());
