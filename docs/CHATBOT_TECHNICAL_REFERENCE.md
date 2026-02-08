# Technical Reference: AI Chatbot Frontend Integration

## Component Architecture

### AiChat.jsx Component Structure

```
AiChat (Main Component)
├── State Management
│   ├── messages: Message[]
│   ├── inputValue: string
│   ├── isLoading: boolean
│   ├── error: string | null
│   └── messagesEndRef: React.Ref
│
├── Effects
│   └── useEffect: Auto-scroll on messages change
│
├── Handlers
│   ├── handleSendMessage(text): Async message handler
│   └── scrollToBottom(): Auto-scroll function
│
└── JSX Sections
    ├── Header
    ├── Chat Container
    │   ├── Messages Area
    │   │   ├── Suggested Questions (initial)
    │   │   ├── Message Bubbles (dynamic)
    │   │   ├── Loading Indicator (conditional)
    │   │   └── Auto-scroll Ref
    │   ├── Error Alert (conditional)
    │   └── Input Area
    │       ├── Text Input
    │       ├── Send Button
    │       └── Quick Actions
```

---

## Message Object Structure

```javascript
{
  id: number,              // Unique identifier
  type: 'user' | 'bot',   // Message type
  text: string,            // Message content
  timestamp: Date,         // Message time
  safe?: boolean,          // API response safety flag
  isError?: boolean        // Error flag
}
```

---

## API Contract

### Request
```javascript
POST /chat

Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "user_message": "How much did I spend in January?"
}
```

### Response (Success)
```javascript
{
  "response": "In January 2026, your total expenses were ₹24,148...",
  "safe": true
}
```

### Error Response
```javascript
{
  "detail": "Error message from backend"
}
```

---

## State Diagram

```
Initial State
    ↓
User Types → inputValue = text
    ↓
User Sends → Validate
    ↓
Add User Message → messages.push(userMessage)
    ↓
Set Loading → isLoading = true
    ↓
Call API → sendChatMessage()
    ↓
┌─────────────────────────────────┐
│  Success         │  Error        │
└─────────────────────────────────┘
│                  │
↓                  ↓
Add Bot Message    Add Error Message
│                  │
↓                  ↓
safe?              Show Alert
│
├─→ Yes: Normal
└─→ No: Show warning
    ↓
Set Loading = false
    ↓
Reset inputValue
```

---

## Hooks Usage

### useState
```javascript
const [messages, setMessages] = useState([...])
const [inputValue, setInputValue] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

### useRef
```javascript
const messagesEndRef = useRef(null)
// Used with scrollIntoView({ behavior: 'smooth' })
```

### useEffect
```javascript
useEffect(() => {
  scrollToBottom()
}, [messages, isLoading])
// Triggers on any message or loading change
```

---

## Async Message Handler Flow

```javascript
async handleSendMessage(text) {
  1. Validate: !text.trim() || isLoading → return
  2. Clear: setError(null)
  3. Create: userMessage object
  4. Update: setMessages([...messages, userMessage])
  5. Reset: setInputValue('')
  6. Load: setIsLoading(true)
  
  7. try {
       const result = await sendChatMessage(text)
       Create botMessage from result
       setMessages(prev => [...prev, botMessage])
       if (!result.safe) setError(warning)
     }
     
  8. catch (err) {
       Create errorMessage
       setMessages(prev => [...prev, errorMessage])
       setError(message)
       console.error(err)
     }
     
  9. finally {
       setIsLoading(false)
     }
}
```

---

## Message Rendering Logic

### Suggested Questions (Initial State)
```javascript
{messages.length === 1 && !isLoading && (
  <div>/* Suggested questions */</div>
)}
```

### Regular Messages
```javascript
{messages.map(message => (
  <div className={message.type === 'user' ? 'right' : 'left'}>
    {/* Message bubble */}
  </div>
))}
```

### Loading State
```javascript
{isLoading && (
  <div>/* Loading indicator */</div>
)}
```

### Error Alert
```javascript
{error && (
  <div>/* Error banner */</div>
)}
```

---

## Styling Classes

### Message Bubbles

**User Message**
```
bg-blue-600 text-white rounded-br-none
```

**Bot Message**
```
bg-gray-100 text-gray-800 rounded-bl-none
```

**Error Message**
```
bg-red-100 text-red-800 rounded-bl-none
```

### Responsive Classes

```
Text size:    text-sm lg:text-base
Bubble max:   max-w-xs lg:max-w-md
Padding:      p-6 lg:p-8
```

---

## Error Handling Strategy

### Level 1: Input Validation
```javascript
if (!text.trim() || isLoading) return
```

### Level 2: API Error Catch
```javascript
catch (err) {
  console.error('Chat error:', err)
  // Create error message
  // Show error alert
}
```

### Level 3: Safety Check
```javascript
if (!result.safe) {
  setError('Note: This response may contain sensitive...')
}
```

### Level 4: Fallback Response
```javascript
return {
  success: false,
  response: "Sorry, I couldn't process...",
  safe: false
}
```

---

## Auto-Scroll Implementation

```javascript
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ 
    behavior: 'smooth' 
  })
}

useEffect(() => {
  scrollToBottom()
}, [messages, isLoading])
```

**Why it works:**
1. `useRef` captures DOM element
2. `scrollIntoView` with smooth behavior
3. `useEffect` triggers on message/loading change
4. Div placed at end of message list

---

## Input Validation

### Before Sending
```javascript
if (!text.trim() || isLoading) return
```

**Prevents:**
- Empty messages
- Whitespace-only messages  
- Multiple simultaneous requests

### Button Disable Logic
```javascript
disabled={isLoading || !inputValue.trim()}
```

**Also prevents:**
- Clicking while loading
- Clicking with empty input

---

## Loading State Management

```
Initial:     isLoading = false
On send:     isLoading = true
While API:   Show spinner, disable inputs
On response: isLoading = false
On error:    isLoading = false
```

**Visual feedback:**
- Input: `disabled:bg-gray-200 disabled:text-gray-500`
- Button: `disabled:bg-gray-400 disabled:cursor-not-allowed`
- Spinner: `<Loader className="animate-spin" />`

---

## Message ID Assignment

```javascript
const userMessage = {
  id: messages.length + 1,    // Current length + 1
  type: 'user',
  ...
}

const botMessage = {
  id: messages.length + 2,    // Will be current after user add
  type: 'bot',
  ...
}
```

**Why this works:**
1. IDs are unique per conversation
2. Used for React `key` prop
3. Enables proper re-renders
4. Allows message updates if needed

---

## Timestamp Formatting

```javascript
timestamp: new Date()

// Display
{message.timestamp.toLocaleTimeString([], { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
```

**Format:** HH:MM (AM/PM based on locale)

---

## API Client Integration

### chatApi.js
```javascript
export const sendChatMessage = async (userMessage) => {
  try {
    const response = await api.post("/chat", {
      user_message: userMessage
    })
    return {
      success: true,
      response: response.data.response,
      safe: response.data.safe
    }
  } catch (error) {
    return {
      success: false,
      response: "Sorry, I couldn't process...",
      safe: false
    }
  }
}
```

**Key points:**
- Uses axios instance with JWT
- Handles network errors
- Returns consistent format
- Never throws (returns error object)

---

## Axios Interceptor (Already Configured)

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Means:**
- No manual token handling needed
- All requests auto-authenticated
- Logout removes token automatically

---

## Dependencies

### React Hooks
- `useState` - State management
- `useEffect` - Side effects
- `useRef` - DOM references

### Lucide Icons
- `Send` - Send button
- `Plus` - New chat button
- `MessageCircle` - Empty state
- `Loader` - Loading spinner
- `AlertCircle` - Error icon

### CSS Framework
- Tailwind CSS - All styling

### HTTP Client
- Axios - API calls (pre-configured)

---

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Uses:**
- ES2020+ JavaScript
- CSS Grid/Flexbox
- LocalStorage

---

## Performance Considerations

### Re-renders
- Triggered by: messages, inputValue, isLoading, error
- Optimized with React keys
- No unnecessary re-renders

### Memory
- Messages stored in state (session only)
- Cleared on page reload
- No memory leaks

### Network
- Single API call per message
- 30s timeout on backend
- Graceful timeout handling

---

## Browser DevTools Tips

### Console
Check for:
```javascript
// Error logs
console.error('Chat API Error:', error)

// Component logs
console.log('Message sent:', userMessage)
```

### Network Tab
Monitor:
- POST /chat requests
- Response time (~1-30s)
- Headers include Authorization
- Payload has user_message

### React DevTools
Inspect:
- Component props/state
- messages array
- isLoading flag
- error state

---

## Testing Approach

### Unit Testing (Jest)
```javascript
test('sends message on input', async () => {
  // Render component
  // Type message
  // Click send
  // Verify API called
  // Verify message added
})
```

### Integration Testing
```javascript
test('full chat flow', async () => {
  // Start backend
  // Render chat
  // Send real message
  // Verify response
  // Verify display
})
```

### E2E Testing (Cypress)
```javascript
cy.visit('/ai-chat')
cy.get('input').type('How much...')
cy.get('button[aria-label="Send"]').click()
cy.contains('In January').should('be.visible')
```

---

## Debugging Checklist

- [ ] JWT token in localStorage?
- [ ] Backend running on 8000?
- [ ] Ollama running?
- [ ] Network requests showing in DevTools?
- [ ] Response contains `response` field?
- [ ] Message added to state?
- [ ] Component re-renders?
- [ ] Auto-scroll working?

---

## Deployment Checklist

Before deploying:
- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] No TypeScript errors  
- [ ] Backend API reachable
- [ ] JWT auth working
- [ ] Ollama model loaded
- [ ] Database has test data
- [ ] Mobile responsive tested

---

## Environment Variables Needed

```bash
# .env.local (frontend)
VITE_API_BASE_URL=http://localhost:8000/api

# Backend .env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
DATABASE_URL=postgresql://...
```

---

This technical reference covers all aspects of the chatbot integration for developers maintaining or extending the codebase.
