# Civic Connect Chatbot API

## Overview

Production-ready rule-based chatbot for Civic Connect platform. The chatbot uses predefined knowledge and pattern matching to provide accurate, factual responses about the platform.

## Endpoint

**POST** `/api/chatbot/chat`

## Request Format

```json
{
  "message": "What is Civic Connect?"
}
```

## Response Format

```json
{
  "text": "Civic Connect is a civic-tech platform designed to help citizens report and resolve civic issues efficiently..."
}
```

## Supported Topics

The chatbot can answer questions about:

1. **What is Civic Connect?** - Platform overview and purpose
2. **How to Report Issues** - Step-by-step guide for reporting
3. **How It Works** - Internal system workflow and process
4. **User Roles** - Citizen, Field Staff, Supervisor, Commissioner, Admin
5. **Security & Privacy** - Data protection and security measures
6. **Escalation System** - Auto-escalation rules and time limits
7. **Notifications** - How users are informed about updates
8. **Analytics** - Dashboard and governance features
9. **Issue Categories** - Types of issues that can be reported
10. **Registration** - How to create an account
11. **Validation** - AI/ML validation process

## Example Requests

### Example 1: Greeting
```json
{
  "message": "Hello"
}
```

**Response:**
```json
{
  "text": "Hello! I'm the Civic Connect Assistant. I'm here to help you understand how Civic Connect works and guide you through reporting civic issues."
}
```

### Example 2: What is Civic Connect?
```json
{
  "message": "What is Civic Connect?"
}
```

**Response:**
```json
{
  "text": "Civic Connect is a civic-tech platform designed to help citizens report and resolve civic issues efficiently. Citizens can report problems like potholes, garbage, water leakage, drainage issues, broken streetlights, and sanitation problems. The platform automatically routes complaints to the correct department, tracks resolution progress, and ensures issues are resolved within specified time limits."
}
```

### Example 3: How to Report
```json
{
  "message": "How do I report an issue?"
}
```

**Response:**
```json
{
  "text": "To report an issue, you need to: 1) Register or log in to your account using your phone number with OTP verification, 2) Click on 'Report Issue' and select the type of problem (potholes, garbage, water leakage, etc.), 3) Take or upload a photo of the issue, 4) Provide a description and location (auto-detected or manual), 5) Select the department and priority level, 6) Submit your complaint. The system will validate your complaint using AI/ML technology before accepting it."
}
```

### Example 4: Out of Scope Question
```json
{
  "message": "What's the weather today?"
}
```

**Response:**
```json
{
  "text": "I'm here to help you understand Civic Connect. I can answer questions about what Civic Connect is, how to report issues, how the system works, user roles, security and privacy, escalation system, notifications, and analytics. Could you please ask about one of these topics?"
}
```

## Error Handling

### Invalid Request (400)
```json
{
  "text": "Please provide a valid message. I'm here to help you understand Civic Connect."
}
```

### Message Too Long (400)
```json
{
  "text": "Your message is too long. Please keep it under 500 characters and ask a specific question about Civic Connect."
}
```

### Server Error (500)
```json
{
  "text": "I apologize, but I'm experiencing a technical issue. Please try again in a moment, or contact support if the problem persists."
}
```

## Implementation Details

- **Pattern Matching**: Uses keyword-based intent detection
- **No AI/LLM**: Rule-based system with predefined responses
- **No Hallucinations**: Only returns factual information from knowledge base
- **Production Ready**: Error handling, input validation, and safe responses
- **Government Friendly**: Professional, clear, and respectful language

## Testing

Test the endpoint using curl:

```bash
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Civic Connect?"}'
```

Or using a REST client:

```
POST http://localhost:5000/api/chatbot/chat
Content-Type: application/json

{
  "message": "How do I report an issue?"
}
```

