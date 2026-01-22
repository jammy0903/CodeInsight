# Java Simulator Refactoring Plan

## 1. Objective

To enhance the Java simulator's accuracy, stability, and security by refactoring it from the current AST-based in-memory simulation to a **real-execution model**.

This new model will leverage the **Java Debug Interface (JDI)** for precise execution control and state inspection, while implementing a multi-layered security sandbox to safely run user-submitted code without relying on Docker.

## 2. Core Architecture & Strategy

The new architecture is based on a "client-agent" model, separating the Node.js orchestrator from the Java debugging logic.

*   **Node.js Client (`engine/`):** A set of TypeScript modules responsible for managing external processes (`javac`), communicating with the Java agent, and enforcing security policies.
*   **Java Agent (`agent/`):** A standalone Java sub-project that is launched by the Node.js client. This agent uses the JDI library to attach to and control the user's code running in a separate JVM, extracting state information (stack, heap) and sending it back to the client as JSON.
*   **Security Model (3-Layer Defense):**
    1.  **Static Validation:** A pre-execution check to block code containing blacklisted, dangerous keywords (`java.io`, `java.net`, etc.).
    2.  **JVM Sandboxing:** Utilizes Java's `SecurityManager` with a strict policy file (`java.policy`) to prevent unauthorized actions like file I/O or network access at runtime.
    3.  **Process Timeout:** A hard timeout to kill the Java process, preventing infinite loops and denial-of-service attacks.

## 3. Final Folder Structure

The `packages/backend/src/modules/simulators/java/` directory will be organized as follows:

```text
packages/backend/src/modules/simulators/java/
├── index.ts
├── routes.ts
├── java-simulation.service.ts  # Node.js Service: Orchestrates the entire simulation flow.
├── types.ts                    # Common TypeScript types for the simulator.
│
├── engine/                     # [Node.js] Manages external processes and communication.
│   ├── compiler.ts             # Executes 'javac' to compile user code.
│   ├── debugger-client.ts      # Communicates (stdio/JSON) with the Java Agent.
│   ├── file-manager.ts         # Manages temporary source/class files.
│   └── security/               # Security policy components.
│       ├── validator.ts        # L1: Static keyword validator.
│       └── java.policy         # L2: JVM SecurityManager policy file.
│
└── agent/                      # [Java] The JDI Debugging Agent (a separate sub-project).
    ├── build.gradle            # Gradle build script for the agent.
    ├── src/main/java/com/vis/  # Agent's source code.
    │   ├── DebuggerAgent.java  # Main agent logic using JDI.
    │   ├── SnapshotMaker.java  # Logic to capture JVM state (stack, heap).
    │   └── JsonWriter.java     # Serializes state to JSON for the Node.js client.
    └── dist/                   # Build output directory for the agent's .jar file.
```

## 4. Action Plan (Next Steps)

1.  **Initialize Java Agent Project:**
    *   Create the `packages/backend/src/modules/simulators/java/agent/` directory.
    *   Set up a basic Gradle project inside with `build.gradle` and a placeholder `DebuggerAgent.java`.

2.  **Define Communication Protocol:**
    *   Establish that the `debugger-client.ts` (Node.js) and `DebuggerAgent.java` (Java) will communicate over **standard I/O (stdio)**.
    *   Define the JSON structure for commands (e.g., `{"command": "next"}`) and data snapshots.

3.  **Integrate Build Process:**
    *   Modify the root `package.json` build script (`pnpm build`).
    *   Ensure that running the main build command first triggers the Gradle build in the `agent/` directory, producing `debugger-agent.jar`.

4.  **Implement Core Components:**
    *   Develop the `engine/` components in Node.js, starting with `file-manager.ts` and `compiler.ts`.
    *   Implement the `debugger-client.ts` to spawn the Java agent process.
    *   Implement the basic JDI connection logic in `DebuggerAgent.java`.

5.  **Implement Security Layers:**
    *   Implement the static `validator.ts`.
    *   Create the `java.policy` file.
    *   Modify `debugger-client.ts` to launch the agent with the `SecurityManager` and a process timeout.
