    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │              │         │              │         │              │
    │   Browser    │         │   Your       │         │  Anthropic   │
    │  index.html  │────────>│   Machine    │────────>│    API       │
    │              │         │  server.js   │         │              │
    │              │<────────│              │<────────│              │
    └──────────────┘         └──────────────┘         └──────────────┘
          ▲                        ▲                        ▲
          │                        │                        │
          │                   🔑 API Key                   │
      Localhost              stored here              External API
     (127.0.0.1)              securely                  endpoint
