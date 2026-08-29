# LifeStock Core — Agent Instructions

## Design Quality

This project uses [Taste-Skills](./.taste-skills/) for design quality control.

Before shipping any UI changes, run through:
1. `.taste-skills/visual-language/hierarchy-principles/SKILL.md` — check visual hierarchy
2. `.taste-skills/typography/type-systems/SKILL.md` — verify type scale consistency
3. `.taste-skills/visual-language/spatial-rhythm/SKILL.md` — check spacing and rhythm
4. `.taste-skills/visual-language/craft-signals/SKILL.md` — verify alignment, radii, states
5. `.taste-skills/evaluation/quality-checklist/SKILL.md` — full quality pass

## Project Rules

- Core does NOT depend on AI — all critical functions work offline
- All UI text is in Ukrainian (uk-UA)
- Data stored in localStorage — no backend required
- Mobile-first responsive design
