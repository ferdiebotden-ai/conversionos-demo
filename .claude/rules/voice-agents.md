# Voice Agent Rules

- ElevenLabs Conversational AI powers the voice agents
- Three persona agents: Emma (receptionist), Marcus (quote specialist), Mia (design consultant)
- Agent IDs are stored in env vars: ELEVENLABS_AGENT_EMMA, ELEVENLABS_AGENT_MARCUS, ELEVENLABS_AGENT_MIA
- Each tenant deployment may have different agent IDs (different voice configurations)
- Voice agent endpoints: /api/voice/signed-url, /api/voice/token
- Widget component: src/components/receptionist/receptionist-widget.tsx
