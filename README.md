# MicroBot

A lightweight AI agent framework inspired by openclaw & nanobot, implemented with TypeScript + Node.js

## 🚀 Features

- **Lightweight**: Minimal dependencies, fast startup
- **TypeScript**: Full type safety
- **Modular**: Easy to extend and customize
- **Session Management**: Built-in session handling
- **Tool Integration**: Simple tool registry system
- **WebSocket Support**: Real-time communication
- **Local AI Models**: Integrated Ollama support with qwen3-vl model
- **Memory Persistence**: Context-aware conversations with persistent memory
- **Feishu Integration**: Real-time communication with Feishu (Lark) messaging platform

## 📦 Installation

### Prerequisites

- Node.js >= 20.0.0
- Ollama (for local AI model support)
- qwen3-vl:8b model (install with `ollama pull qwen3-vl:8b`)

### Install

```bash
# Install Ollama first
# Visit https://ollama.ai to download and install

# Pull the qwen3-vl:8b model
ollama pull qwen3-vl:8b

# Using pnpm
pnpm add microbot

# Using npm
npm install microbot

# Using yarn
yarn add microbot
```

## 🛠️ Usage

### Local Ollama Setup

Before running microbot with the qwen3-vl model, make sure:

1. Ollama is installed and running on your system
2. The qwen3-vl:8b model is downloaded:
   ```bash
   ollama pull qwen3-vl:8b
   ```
3. Ollama server is running (usually starts automatically):
   ```bash
   ollama serve
   ```

### CLI Usage

```bash
# Start MicroBot (make sure Ollama is running first)
microbot start

# Check status
microbot status

# Help
microbot --help
```

### Environment Configuration

Copy the default configuration:
```bash
cp .env.example .env
```

The default configuration connects to a local Ollama instance:
```env
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_PROTOCOL=http
OLLAMA_MODEL=qwen3-vl:8b
```

### Feishu Integration (WebSocket)

#### Prerequisites

1. **Feishu Developer Account**: You need to be a Feishu (Lark) developer
2. **Feishu App**: Create an app in the Feishu Developer Console
3. **Internet Access**: Your server needs outbound internet access to connect to Feishu WebSocket

#### Setup Steps

1. **1. Create Feishu App**
   - Go to [Feishu Developer Console](https://open.feishu.cn/app)
   - Create a new app ("From Scratch" or "Enterprise Self-built App")
   - Get your `App ID` and `App Secret` from the "Credentials" section

2. **2. Configure App Features**
   - Enable "Bot" feature in the app settings
   - Enable "Event Subscriptions" for message events
   - Add the required scopes: `im:message`, `im:message:read`, `im:message:send`

3. **3. Update Environment Variables**
   - Add these variables to your `.env` file:
   ```env
   FEISHU_APP_ID=your_app_id
   FEISHU_APP_SECRET=your_app_secret
   ```

4. **4. Start MicroBot**
   - Run MicroBot with Feishu integration:
   ```bash
   microbot start
   ```
   - The Feishu WebSocket connection will be established automatically

5. **5. Test the Integration**
   - Add the bot to a Feishu group or chat
   - Send a message to the bot
   - The bot should respond using the local Ollama model

#### Feishu Integration Details

- **WebSocket Endpoint**: `wss://open.feishu.cn/open-apis/ws/v3/events`
- **Connection Type**: Client-initiated WebSocket connection
- **Authentication**: Uses Feishu API access tokens
- **Heartbeat**: Automatic 30-second heartbeat to maintain connection
- **Reconnection**: Automatic reconnection on failure
- **Supported Events**: `im.message.receive_v1` (message events)
- **Message Processing**: All Feishu messages are automatically processed by the same agent logic as WebSocket messages

#### Troubleshooting

- **WebSocket Connection Failed**: Check your App ID and App Secret
- **No Response from Bot**: Verify Ollama is running and the model is available
- **Access Token Error**: Check if your app has the correct scopes
- **Network Issues**: Ensure your server has outbound internet access

#### Advanced Configuration

You can customize the Feishu integration in your code:

```typescript
import { MicroBot } from 'microbot';

const bot = new MicroBot({
  feishuConfig: {
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    reconnectInterval: 10000,  // 10 seconds
    heartbeatInterval: 45000  // 45 seconds
  }
});

await bot.start();
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
│   │   ├── loop.ts     # Agent loop with Ollama integration
│   │   ├── memory.ts   # Memory management
│   │   └── skills.ts   # Agent skills
│   ├── api/            # API clients
│   │   ├── ollama.ts   # Ollama API client
│   │   ├── feishu.ts   # Feishu (Lark) integration
│   │   └── websocket.ts # WebSocket server
│   ├── session/        # Session management
│   │   └── manager.ts  # Session manager
│   ├── utils/          # Utilities
│   │   └── logger.ts   # Logger
│   └── index.ts        # Main entry
├── dist/               # Build output
├── sessions/           # Session storage
├── .env                # Environment configuration
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

# Pull required model
ollama pull qwen3-vl:8b
```

### Scripts

```bash
# Development mode (make sure Ollama is running)
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

- **Agent**: The main AI agent that processes requests using local Ollama models
- **Session**: Manages conversation state and history
- **Tool**: Functions that the agent can call
- **Memory**: Stores and retrieves information
- **Skill**: Pre-defined capabilities of the agent
- **Ollama Client**: Communicates with local Ollama instance to process AI requests

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

### Ollama Integration

The framework integrates with Ollama to provide local AI processing:

- Automatically connects to the configured Ollama instance
- Supports the qwen3-vl:8b model for both text and vision processing
- Validates model availability before processing requests
- Handles API errors gracefully

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
- Powered by Ollama for local AI inference
- qwen3-vl:8b model support for advanced AI capabilities
- Open-source technologies

---

**Happy Bot Building!** 🤖
