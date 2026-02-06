# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microbot is a lightweight AI agent framework based on nanobot, implemented with TypeScript + Node.js. It provides a simple foundation for building AI agents with memory, skills, and context management capabilities.

## Architecture

The project follows a modular architecture with the following key components:

### Core Components
- `AgentLoop` (`src/agent/loop.ts`): Main agent lifecycle manager that handles the message processing loop
- `ContextBuilder` (`src/agent/context.ts`): Builds context for AI interactions including system prompts, memory, skills, and conversation history
- `SessionManager` (`src/session/manager.ts`): Manages conversation sessions with persistence to JSON files
- `MemoryStore` (`src/agent/memory.ts`): Handles persistent memory storage in Markdown files
- `SkillsLoader` (`src/agent/skills.ts`): Loads and manages skills from the `skills/` directory
- `ToolRegistry` (`src/agent/tools/registry.ts`): Registry for managing available tools and their execution

### Utility Modules
- `Logger` (`src/utils/logger.ts`): Simple logging utility with timestamp and log levels
- Command interface via `commander` in `src/index.ts`

## File Structure

```
src/
├── agent/              # Core agent functionality
│   ├── loop.ts         # Main agent loop
│   ├── context.ts      # Context building
│   ├── memory.ts       # Memory management
│   ├── skills.ts       # Skills loading
│   └── tools/          # Tool registry and definitions
├── session/            # Session management
│   └── manager.ts      # Session handling and persistence
└── utils/              # Utilities
    └── logger.ts       # Logging functionality
```

## Development Commands

All commands should be run from the project root:

- `pnpm dev`: Run the application in development mode using tsx
- `pnpm build`: Compile TypeScript to JavaScript (output to `dist/`)
- `pnpm start`: Run the compiled application from `dist/`
- `pnpm lint`: Lint source files with ESLint
- `pnpm format`: Format source files with Prettier
- `pnpm test`: Run tests with Vitest

## Key Features

- Persistent session management (stored in `sessions/` directory)
- Memory persistence (stored in `memory/` directory as Markdown files)
- Skill loading system (from `skills/` directory)
- Modular tool system with registry
- Context-aware AI interactions
- Support for different channels and users per session

## Important Notes

- The application expects Node.js >=20.0.0
- Files are stored locally in `sessions/`, `memory/`, and `skills/` directories relative to the working directory
- The system uses a polling approach for message processing (currently simulating message consumption)
- TypeScript is configured to output to the `dist/` directory
- The binary executable is available as `microbot` via the `microbot.mjs` entry point