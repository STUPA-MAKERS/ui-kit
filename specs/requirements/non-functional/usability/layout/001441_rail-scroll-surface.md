---
id: "001441"
title: The scroll part of the navigation rail is a surface
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/nav-rail/nav-rail.component.scss
scope:
  - shell
---

# The scroll part of the navigation rail is a surface

The part of the navigation rail that scrolls must lie on a surface with rounded corners, 8 px
narrower than the rail. The surface must fill the height of the rail from below the search entry
down to the tools at the foot, with one gap of `--space-4` above the tools, also when its items
need less room. The items must start at the top of the surface. The items must cut hard at the
edge of that surface and must not fade. The longest label of the rail ("Abstimmungen") must fit
on one line in that surface, in bold and inside the edge of the very high contrast mode too. In
the very high contrast mode (000605), the surface must have a white edge that keeps clear of the
line between the rail and the page.

Reason: The fade of the rail was the last fade in the frame of the app. A surface gives the
items an edge to cut at, as every other scroll area has (000193). A surface that ends after its
items leaves a hole in the rail, so the rail looks unfinished. A surface 24 px narrower left 72
px for a label, so "Abstimmungen" (81 px) broke into "Abstimmun-gen".

Test: Screenshots of the rail with more items than fit, in the light and the dark theme and in
the very high contrast mode.
