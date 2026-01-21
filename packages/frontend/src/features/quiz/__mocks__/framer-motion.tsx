// packages/frontend/src/features/quiz/__mocks__/framer-motion.tsx
// Mock framer-motion to prevent animations from interfering with tests.

const filterMotionProps = ({ whileHover, whileTap, initial, animate, exit, transition, key, ...rest }: any) => rest;

// Mock motion components to just render their children
export const motion = {
  div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
  button: ({ children, ...props }: any) => <button {...filterMotionProps(props)}>{children}</button>,
  // Add other motion components as needed
};

// Mock AnimatePresence to just render its children
export const AnimatePresence = ({ children }: any) => <>{children}</>;

// Export any other named exports from framer-motion if necessary,
// but for testing purposes, these simple passthrough mocks are usually enough.
