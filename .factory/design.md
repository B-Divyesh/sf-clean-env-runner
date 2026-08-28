# Visual thesis — the environment broadsheet

## Direction and rationale

Clean Env Runner uses a **monochrome typographic broadsheet**: a sober, ink-on-stock
editorial system that makes environment policy feel inspectable rather than magical.
The landing page reads like a freshly printed technical extra—masthead, rules,
numbered columns, proof marks, and a single explanatory plate. It belongs to this
product because a clean environment is fundamentally an act of publishing a small,
reviewable record of what was allowed in and what stayed out.

This is intentionally single-mode. The warm paper background is painted explicitly;
there is no dark theme because the print metaphor and its measured black/vermillion
contrast are the identity, not a generic theme wrapper.

## Tokens

- Paper/background: `#f2efe6`; raised stock: `#faf8f1`.
- Ink/text: `#161614`; muted ink: `#5b5952`.
- Rule/UI outline: `#77736a`; faint rule: `#cbc5b8`.
- Proof/accent: `#a62c1f`; accent contrast: `#fffaf0`.
- Success: `#25623b`; warning: `#795b00`; danger: `#9e241b`.
- All body combinations exceed 4.5:1; color is paired with words, marks, or shape.

## Type and spacing

Two system-resident stacks avoid font downloads entirely. Headlines use Georgia,
`Times New Roman`, and serif fallbacks: compressed by scale and rule rather than by
a novelty display font. Interface, code, folios, and labels use `ui-monospace`,
SFMono-Regular, Consolas, and monospace. The type scale is 12, 14, 16, 20, 32,
and clamp(48–104) px. Body copy is always at least 16 px and 1.55 leading.

Spacing follows a 4/8 px press grid: 4, 8, 12, 16, 24, 32, 48, 72, and 96 px.
Desktop sections use asymmetric editorial columns; at 720 px they stack in reading
order. At 390 px the issue metadata and decorative marginalia disappear, while
actions become full-width and the command specimen remains horizontally scrollable.

## Interaction grammar and motion

Links receive a descending proof-red underline; buttons invert like a physical ink
stamp. Focus uses a 3 px red outer rule with 2 px paper separation. The manifest
workbench behaves like an editor's proof: typing updates an adjacent audit ledger,
and presets replace the sheet with a short opacity transition. No parallax, looping,
or decorative movement exists. Standard transitions last 160 ms and animate only
opacity/transform/color. Under `prefers-reduced-motion`, all transitions and smooth
scrolling become instant.

## Asset plan and provenance

- `site/public/environment-proof.webp`: original, AI-generated editorial still life
  commissioned for this product with `/opt/fleet/lib/gen-image.sh` (factory-image),
  then resized and encoded locally as WebP, including a 720 px responsive derivative.
  Prompt: “top-down monochrome editorial
  photograph for a technical newspaper, a single cream paper manifest on a black
  letterpress bed, narrow columns of abstract code-like marks with no legible words,
  one vermilion proofreader stamp marking a clean rectangular boundary, tactile paper
  grain, stark raking light, high contrast, no people, no logos, no UI screenshot,
  wide landscape composition.” Generated 2026-08-28. Used as explanatory atmosphere,
  with alt text describing the boundary metaphor. No third-party assets.
- All rules, status marks, and UI diagrams are CSS/HTML primitives authored in-repo.

## Accessibility and performance intent

The visual system uses actual headings, lists, tables, and form controls rather than
positioned facsimiles. The illustration has fixed dimensions and responsive sources;
code wraps or scrolls without clipping the page. Hero imagery stays below 300 KB,
CSS below 50 KB, and first-load JS below 200 KB. Print styling removes navigation and
interactive demo chrome while retaining the installation and manifest reference.
