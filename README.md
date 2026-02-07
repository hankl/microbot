# MicroBot

A lightweight AI agent framework inspired by openclaw & nanobot, implemented with TypeScript + Node.js

## 🚀 Features

- **Lightweight**: Minimal dependencies, fast startup
- **TypeScript**: Full type safety
- **Modular**: Easy to extend and customize
- **Session Management**: Built-in session handling
- **Tool Integration**: Simple tool registry system
- **WebSocket Support**: Real-time communication
- **Multi-Model Support**: Support for Ollama, MiniMax, and OpenAI-compatible APIs
- **Memory Persistence**: Context-aware conversations with persistent memory
- **Feishu Integration**: Real-time communication with Feishu (Lark) messaging platform using official SDK

## 📦 Installation

### Prerequisites

- Node.js >= 20.0.0
- For local AI models: Ollama (optional, for local model support)

### Install

```bash
# Using pnpm
pnpm add microbot

# Using npm
npm install microbot

# Using yarn
yarn add microbot
```

### Global Installation

To use the `microbot` CLI command globally:

```bash
npm install -g .
# or
pnpm link --global
```

## 🛠️ Usage

### CLI Usage

```bash
# Start MicroBot
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

#### Model Configuration

MicroBot supports multiple AI model providers through a unified interface:

```env
# Model Type: ollama, minimax, or openai
MODEL_TYPE=ollama

# For Ollama (Local Models)
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_PROTOCOL=http
OLLAMA_MODEL=qwen3-vl:8b

# For MiniMax (Cloud Models)
MODEL_NAME=MiniMax-M2.1
MODEL_API_KEY=your_minimax_api_key
MODEL_BASE_URL=https://api.minimaxi.com/v1

# For OpenAI-Compatible APIs
MODEL_NAME=gpt-4
MODEL_API_KEY=your_openai_api_key
MODEL_BASE_URL=https://api.openai.com/v1
```

#### Supported Model Types

| Model Type | Description | Required Config |
|-----------|-------------|-----------------|
| `ollama` | Local models via Ollama | `OLLAMA_HOST`, `OLLAMA_PORT`, `OLLAMA_MODEL` |
| `minimax` | MiniMax cloud models | `MODEL_NAME`, `MODEL_API_KEY`, `MODEL_BASE_URL` |
| `openai` | OpenAI-compatible APIs | `MODEL_NAME`, `MODEL_API_KEY`, `MODEL_BASE_URL` |

### Feishu Integration (WebSocket)

#### Prerequisites

1. **Feishu Developer Account**: You need to be a Feishu (Lark) developer
2. **Feishu App**: Create an app in the Feishu Developer Console
3. **Internet Access**: Your server needs outbound internet access to connect to Feishu WebSocket

#### Setup Steps

1. **Create Feishu App**
   - Go to [Feishu Developer Console](https://open.feishu.cn/app)
   - Create a new app ("From Scratch" or "Enterprise Self-built App")
   - Get your `App ID` and `App Secret` from the "Credentials" section

2. **Configure App Features**
   - Enable "Bot" feature in the app settings
   - Enable "Event Subscriptions" for message events
   - Add the required scopes: `im:message`, `im:message:read`, `im:message:send`

3. **Update Environment Variables**
   - Add these variables to your `.env` file:
   ```env
   FEISHU_APP_ID=your_app_id
   FEISHU_APP_SECRET=your_app_secret
   ```

4. **Start MicroBot**
   - Run MicroBot with Feishu integration:
   ```bash
   microbot start
   ```
   - The Feishu WebSocket connection will be established automatically using the official SDK

5. **Test the Integration**
   - Add the bot to a Feishu group or chat
   - Send a message to the bot
   - The bot should respond using the configured AI model

#### Feishu Integration Details

- **SDK**: Uses `@larksuiteoapi/node-sdk` official SDK
- **Connection Type**: Client-initiated WebSocket connection
- **Authentication**: Uses Feishu API access tokens
- **Heartbeat**: Automatic heartbeat to maintain connection
- **Reconnection**: Automatic reconnection on failure
- **Supported Events**: `im.message.receive_v1` (message events)
- **Message Processing**: All Feishu messages are automatically processed by the same agent logic

#### Troubleshooting

- **WebSocket Connection Failed**: Check your App ID and App Secret
- **No Response from Bot**: Verify your AI model is configured correctly and accessible
- **Access Token Error**: Check if your app has the correct scopes
- **Network Issues**: Ensure your server has outbound internet access

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

### Using Different Models

```typescript
import { ModelFactory } from 'microbot';

// Create an Ollama client
const ollamaClient = ModelFactory.createClient({
  type: 'ollama',
  host: 'localhost',
  port: 11434,
  model: 'qwen3-vl:8b'
});

// Create a MiniMax client
const minimaxClient = ModelFactory.createClient({
  type: 'minimax',
  model: 'abab6.5-chat',
  apiKey: 'your_api_key',
  baseUrl: 'https://api.minimaxi.com/v1'
});

// Create an OpenAI-compatible client
const openaiClient = ModelFactory.createClient({
  type: 'openai',
  model: 'gpt-4',
  apiKey: 'your_api_key',
  baseUrl: 'https://api.openai.com/v1'
});

// Use the client
const response = await ollamaClient.chat({
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## 📁 Project Structure

```
microbot/
├── src/                # Source code
│   ├── agent/          # AI agent core
│   │   ├── tools/      # Tool registry
│   │   ├── context.ts  # Execution context
│   │   ├── loop.ts     # Agent loop with model integration
│   │   ├── memory.ts   # Memory management
│   │   └── skills.ts   # Agent skills
│   ├── api/            # API clients
│   │   ├── model.ts           # Model interface definition
│   │   ├── model-factory.ts  # Model factory for creating clients
│   │   ├── ollama-adapter.ts  # Ollama client adapter
│   │   ├── minimax.ts         # MiniMax API client
│   │   ├── openai-compatible.ts # OpenAI-compatible API client
│   │   ├── feishu.ts          # Feishu (Lark) integration with SDK
│   │   └── websocket.ts       # WebSocket server
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

- **Agent**: The main AI agent that processes requests using configurable AI models
- **Session**: Manages conversation state and history
- **Tool**: Functions that the agent can call
- **Memory**: Stores and retrieves information
- **Skill**: Pre-defined capabilities of the agent
- **Model Client**: Unified interface for communicating with different AI providers

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

#### ModelClient Interface

```typescript
interface ModelClient {
  chat(request: ModelRequest): Promise<ModelResponse>;
  stream(request: ModelRequest): AsyncIterable<StreamChunk>;
}
```

#### ModelRequest

```typescript
interface ModelRequest {
  messages: Message[];
  model?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
}
```

#### ModelResponse

```typescript
interface ModelResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Model Integration

The framework provides a unified interface for multiple AI providers:

- **Ollama**: Local model inference with support for various models
- **MiniMax**: Cloud-based AI models with high performance
- **OpenAI-Compatible**: Any API that follows OpenAI's format

All model clients implement the same `ModelClient` interface, making it easy to switch between providers.

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
- Powered by Ollama, MiniMax, and OpenAI-compatible APIs for AI inference
- Feishu SDK integration for seamless messaging
- Open-source technologies

---

**Happy Bot Building!** 🤖
