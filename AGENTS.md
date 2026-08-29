# LifeStock Core — Agent Instructions

## Design Quality

This project uses two taste-skill libraries:

### Taste-Skills (Dragoon0x) — Design Judgment
Path: `.taste-skills/` — 39 skills for evaluating design quality.
Before shipping UI changes, run through:
1. `.taste-skills/visual-language/hierarchy-principles/SKILL.md` — visual hierarchy
2. `.taste-skills/typography/type-systems/SKILL.md` — type scale consistency
3. `.taste-skills/visual-language/spatial-rhythm/SKILL.md` — spacing and rhythm
4. `.taste-skills/visual-language/craft-signals/SKILL.md` — alignment, radii, states
5. `.taste-skills/evaluation/quality-checklist/SKILL.md` — full quality pass

### Taste Skill (Leonxlnx) — Design Generation
Path: `.taste-skill/` — 13 skills for building premium UIs.
Key skills for this project:
1. `.taste-skill/taste-skill/SKILL.md` — anti-slop frontend (main skill)
2. `.taste-skill/minimalist-skill/SKILL.md` — clean editorial style
3. `.taste-skill/soft-skill/SKILL.md` — premium agency-level design
4. `.taste-skill/redesign-skill/SKILL.md` — redesign existing UI
5. `.taste-skill/output-skill/SKILL.md` — prevent LLM code truncation

## Prompt Engineering

Path: `.prompt-engineering-guide/` — DAIR.AI prompt engineering reference.
Guides for crafting effective AI prompts in LifeStock AI integrations:
1. `guides/prompts-basic-usage.md` — summarization, classification, code gen, reasoning
2. `guides/prompts-advanced-usage.md` — CoT, Few-Shot, ToT, RAG, ReAct, PAL
3. `guides/prompts-reliability.md` — hallucinations, factuality, robustness
4. `guides/prompts-adversarial.md` — prompt injection, jailbreaks, defense
5. `notebooks/` — 12 Jupyter notebooks with working examples

## Project Rules

- Core does NOT depend on AI — all critical functions work offline
- All UI text is in Ukrainian (uk-UA)
- Data stored in localStorage — no backend required
- Mobile-first responsive design
