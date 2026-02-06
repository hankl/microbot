# MicroBot

A lightweight AI agent framework based on nanobot, implemented with TypeScript + Node.js

## 🚀 Features

- **Lightweight**: Minimal dependencies, fast startup
- **TypeScript**: Full type safety
- **Modular**: Easy to extend and customize
- **Session Management**: Built-in session handling
- **Tool Integration**: Simple tool registry system
- **WebSocket Support**: Real-time communication

## 📦 Installation

### Prerequisites

- Node.js >= 20.0.0
- pnpm (recommended)

### Install

```bash
# Using pnpm
pnpm add microbot

# Using npm
npm install microbot

# Using yarn
yarn add microbot
```

## 🛠️ Usage

### CLI Usage

```bash
# Start MicroBot
microbot

# Help
microbot --help
```

### Programmatic Usage

```typescript
import { MicroBot } from 'microbot';

// Create a bot instance
const bot = new MicroBot({
  name: 'MyBot',
  version: '1.0.0'
});

// Register custom tools
bot.registerTool('greet', {
  description: 'Greet the user',
  execute: (args) => {
    return `Hello, ${args.name}!`;
  }
});

// Start the bot
await bot.start();
```

## 📁 Project Structure

```
microbot/
├── src/                # Source code
│   ├── agent/          # AI agent core
│   │   ├── tools/      # Tool registry
│   │   ├── context.ts  # Execution context
│   │   ├── loop.ts     # Agent loop
│   │   ├── memory.ts   # Memory management
│   │   └── skills.ts   # Agent skills
│   ├── session/        # Session management
│   │   └── manager.ts  # Session manager
│   ├── utils/          # Utilities
│   │   └── logger.ts   # Logger
│   └── index.ts        # Main entry
├── dist/               # Build output
├── sessions/           # Session storage
├── microbot.mjs        # CLI entry
├── package.json        # Project config
├── tsconfig.json       # TypeScript config
└── README.md           # This file
```

## 🔧 Development

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd microbot

# Install dependencies
pnpm install
```

### Scripts

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production build
pnpm start

# Run linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

## 📖 Documentation

### Core Concepts

- **Agent**: The main AI agent that processes requests
- **Session**: Manages conversation state and history
- **Tool**: Functions that the agent can call
- **Memory**: Stores and retrieves information
- **Skill**: Pre-defined capabilities of the agent

### API Reference

#### MicroBot Class

```typescript
class MicroBot {
  constructor(options: MicroBotOptions);
  registerTool(name: string, tool: Tool);
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

#### Tool Interface

```typescript
interface Tool {
  description: string;
  execute: (args: Record<string, any>) => Promise<any> | any;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Steps

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run linting and tests (`pnpm lint && pnpm test`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Based on nanobot architecture
- Built with TypeScript and Node.js
- Powered by open-source technologies

---

**Happy Bot Building!** 🤖
