# Library Migration Plans

## Completed
- [x] NES.css → Tailwind (2026-01-11)

## Planned
- None currently

## Migration Process
1. Identify usage (grep for imports/classes)
2. Create replacement with approved lib
3. Remove old dependency from package.json
4. Run pnpm install
5. Test all affected components
