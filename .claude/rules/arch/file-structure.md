# File Structure Rules

## Frontend
```
features/{name}/
├── index.ts          # Public exports
├── {Name}Page.tsx    # Main component
├── components/       # Internal components
├── hooks/            # Feature hooks
└── types.ts          # Types
```

## Backend
```
modules/{name}/
├── routes.ts         # Express routes
├── handlers/         # Business logic
├── types.ts          # Types
└── *.test.ts         # Tests
```

## Imports
- Use `@/` alias (no relative paths like ../../)
