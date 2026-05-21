# AquaStep — Shopify Theme

A modern, performance-focused Shopify theme for **AquaStep**, a water-shoes
brand. Built to the Online Store 2.0 spec (JSON templates + section groups)
so it is fully editable from the Shopify Theme Editor.

![Theme color: teal #2DD4BF](https://img.shields.io/badge/brand-AquaStep-2DD4BF)
![Online Store 2.0](https://img.shields.io/badge/Shopify-Online%20Store%202.0-95BF47)

## Highlights

- Online Store 2.0 JSON templates + section groups (`header-group`, `footer-group`)
- Editable hero, featured collection, features grid, image-with-text,
  testimonials, and newsletter sections — all merchandiser-friendly
- Liquid + vanilla CSS/JS only — no build step, drag-and-drop into Shopify
- Customer accounts, cart, search, blog, contact, 404, password, gift card
- Brand palette pre-tuned to the AquaStep teal (`#2DD4BF` / `#0F766E`) with
  warm coral accent (`#F97316`)
- SEO meta tags, OG/Twitter cards, sitemap-friendly robots template
- Mobile-first responsive, sticky blurred header, accessible skip-link

## Installing into Shopify

1. **Zip the theme files** (do _not_ zip the parent folder — zip the
   contents). On macOS/Linux:

   ```bash
   cd shopify-water-shoes-theme
   zip -r ../aquastep-theme.zip . -x "*.git*" "README.md" "LICENSE"
   ```

2. In your Shopify admin, go to **Online Store → Themes → Add theme →
   Upload zip file**, then choose `aquastep-theme.zip`.

3. Once uploaded, click **Customize** to open the Theme Editor and tune
   sections, colors, logo, and menus.

## Directory layout

```
shopify-water-shoes-theme/
├── assets/        # CSS, JS, fonts, images
├── config/        # settings_schema.json, settings_data.json
├── layout/        # theme.liquid (main), password.liquid
├── locales/       # en.default.json
├── sections/      # All editable sections + header-group / footer-group
├── snippets/      # Reusable Liquid snippets (product-card, price, icons)
└── templates/     # JSON page templates + customer .liquid templates
```

## Brand setup

Open **Theme settings** in the editor to tune:

- **Logo** image and width
- **Colors** — primary, primary-dark, accent, foreground, background
- **Typography** — heading + body fonts (Shopify font picker)
- **Social links** — Instagram, Facebook, TikTok, YouTube, X

Recommended starting palette (already set as defaults):

| Token              | Hex       |
|--------------------|-----------|
| Primary            | `#2DD4BF` |
| Primary dark       | `#0F766E` |
| Accent             | `#F97316` |
| Background         | `#FFFFFF` |
| Foreground         | `#0F172A` |

## Required navigation menus

This theme references two menus by default. Create them in
**Online Store → Navigation**:

- `main-menu` — top header navigation
- `footer` — primary footer column

## Sections you can add to any page

- `Hero`
- `Featured collection`
- `Features` (4-up cards with emoji icons)
- `Image with text`
- `Testimonials`
- `Newsletter`

Each is configurable via the Theme Editor sidebar.

## License

MIT — see `LICENSE`.

## Credits

Built with care for the AquaStep launch. Theme architecture follows
[Shopify Dawn](https://github.com/Shopify/dawn) conventions.
