# Branding

The user-selected name **Pathway** is retained. Tagline: **Different paths. One destination.** It describes independent routes that converge for a meetup. No claim of worldwide name availability or trademark clearance is made.

Accent `#6269F5`, deeper accent `#5158DC`, light background `#F6F7FB`, ink `#1E2339`, muted text `#687087`; dark background `#101321`, surface `#1B2033`, text `#F2F3FD`. Typography uses platform system fonts with Dynamic Type-capable React Native text. Ionicons provides consistent functional symbols under its own license.

`assets/branding/icon.svg` is the editable master: `background`, `paths` (independent left/right paths), `destination` (shared ring) and `starting-points` groups. It uses stable IDs and a shared gradient definition. `foreground.svg` and `monochrome.svg` are reproducible vector derivatives. `npm run assets` uses Sharp to export native 1024px, Android safe-zone foreground/monochrome, PWA 192/512/maskable and Apple Touch Icon assets, plus the SVG/favicon sources.

The icon draws two paths converging on one destination. Its simple silhouette supports small-size recognition. Android foreground has additional safe-zone padding. Native appearance-specific Liquid Glass icon packages and desktop icon exports are not implemented. Do not describe the SVG groups as an Apple Icon Composer deliverable. Preserve the vector sources when changing the brand and verify exports visually across masks.
