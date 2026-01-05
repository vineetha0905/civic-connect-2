# Chatbot AI Setup Guide

The Civic Connect chatbot now uses AI-powered responses from OpenAI or Google Gemini.

## Environment Variables

Add one of the following to your `.env` file:

### Option 1: OpenAI (Recommended)
```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # Optional, defaults to gpt-3.5-turbo
```

### Option 2: Google Gemini
```env
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro  # Optional, defaults to gemini-pro
```

## Getting API Keys

### OpenAI
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to `.env`

### Google Gemini
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to `.env`

## Priority

The chatbot will use:
1. OpenAI if `OPENAI_API_KEY` is set
2. Google Gemini if `GEMINI_API_KEY` is set (and OpenAI is not)
3. Returns an error if neither is configured

## System Prompt

The chatbot is grounded in Civic Connect domain knowledge through a comprehensive system prompt that includes:
- Platform purpose and features
- Registration and login process
- Issue reporting workflow
- Validation and status updates
- Escalation process
- Resolution and verification
- Privacy and security

The AI will only answer questions related to Civic Connect and respond with "I'm sorry, I don't have enough information to answer that question." for out-of-scope queries.

## Error Handling

The chatbot includes robust error handling for:
- API timeouts (15 second timeout)
- Network failures
- Invalid API keys
- Rate limiting
- Service unavailability

All errors gracefully fall back to a user-friendly message.

