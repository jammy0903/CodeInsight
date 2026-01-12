# CSS Rules

## CRITICAL
- Tailwind v4 ONLY
- NO external CSS libraries (Bootstrap, NES.css, Bulma, etc.)
- ALL custom CSS MUST be inside @layer

## @layer Structure
```
@layer base       // HTML defaults, reset, scrollbar, selection
@layer components // .btn-*, .card-*, .chapter-*, .lesson-*
@layer utilities  // .glow-*, .gradient-*, animation helpers
```

## Priority Order (low → high)
```
@layer base < @layer components < @layer utilities < inline style
```

## FORBIDDEN
- CSS outside @layer (breaks Tailwind priority)
- !important (symptom of broken structure)
- Adding CSS libraries via package.json
- Mixing multiple CSS systems

## When Tailwind Not Working
1. Check if custom CSS is outside @layer
2. Check for imported CSS libraries in index.css
3. Move custom CSS into appropriate @layer
4. NEVER use !important as workaround

## File Structure
```
frontend/src/index.css
├── @import "tailwindcss"
├── @custom-variant dark
├── @config "../tailwind.config.js"
├── :root { /* CSS variables */ }
├── @layer base { ... }
├── @layer components { ... }
├── @layer utilities { ... }
├── @keyframes { ... }
└── @theme inline { /* shadcn */ }
```

## Before Adding Any CSS
1. Can Tailwind utility do this? → Use Tailwind
2. Need custom class? → Add to @layer components
3. Need utility? → Add to @layer utilities
4. Never add outside @layer
