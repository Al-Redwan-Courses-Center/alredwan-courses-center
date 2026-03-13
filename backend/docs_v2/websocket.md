# 🔌 WebSocket – Real-time Attendance

Live attendance updates for the admin dashboard via Django Channels + Redis.

---

## Server Architecture

The backend runs two separate servers:

| Server | Port | Protocol | Purpose |
|--------|------|----------|---------|
| **Gunicorn** | 8000 | HTTP/REST | Standard API requests |
| **Uvicorn** | 8001 | WebSocket/ASGI | Real-time connections |

---

## Authentication

The WebSocket supports two authentication methods:

### 1. Ticket-based Authentication (Recommended) ⭐

This is the more secure approach. The client obtains a short-lived, single-use ticket via REST API, then uses it for the WebSocket connection.

**Why tickets are more secure:**
- Single-use (invalidated after connection)
- Short-lived (30 second expiration)
- Random token (not decodable like JWT)
- Server logs don't expose sensitive claims

**Step 1: Obtain a ticket**

```bash
POST /api/attendance/ws-ticket/
Authorization: JWT <access_token>
```

**Response:**
```json
{
  "ticket": "abc123xyz...",
  "expires_in_seconds": 30,
  "message": "Use this ticket to connect to WebSocket within 30 seconds. Single use only."
}
```

**Step 2: Connect with ticket**

```
ws://<host>:8001/ws/attendance/?ticket=<ticket_token>
```

### 2. JWT Token Authentication (Legacy)

For backwards compatibility, JWT tokens can still be passed in the query string:

```
ws://<host>:8001/ws/attendance/?token=<jwt_access_token>
```

> **⚠️ Security Note:** JWT in query string is less secure because tokens may appear in server logs, browser history, and referrer headers. Use ticket-based auth for production.

---

## Connection

| | |
|--|--|
| **Protocol** | WebSocket |
| **Port** | 8001 |
| **Auth (recommended)** | Ticket via query string `?ticket=...` |
| **Auth (legacy)** | JWT via query string `?token=...` |
| **Required Role** | Admin / Staff |

### Close Codes

| Code | Meaning |
|------|---------|
| Normal | Disconnected normally |
| `4001` | No token/ticket provided |
| `4002` | Invalid token/ticket (expired, used, or malformed) |
| `4003` | Not authorized (not staff) |

---

## Messages

### Client → Server

| Type | Description |
|------|-------------|
| `ping` | Health check |
| `request_summary` | Request today's attendance summary |

```json
{ "type": "ping" }
{ "type": "request_summary" }
```

### Server → Client

#### `connection_established`

Sent immediately after a successful connection.

```json
{
  "type": "connection_established",
  "message": "Connected as Admin User",
  "user_id": 1
}
```

#### `attendance_update`

Sent when an instructor checks in (fingerprint or manual).

```json
{
  "type": "attendance_update",
  "data": {
    "instructor": "محمد أحمد",
    "id": 123,
    "time": "2026-02-05T08:30:00+02:00",
    "status": "present",
    "date": "2026-02-05"
  }
}
```

#### `attendance_check_out`

Sent when an instructor checks out.

```json
{
  "type": "attendance_check_out",
  "data": {
    "instructor": "محمد أحمد",
    "id": 123,
    "check_out_time": "2026-02-05T14:30:00+02:00"
  }
}
```

#### `attendance_rated`

Sent when an admin rates an attendance record via `POST /api/attendance/{id}/rate/`.

```json
{
  "type": "attendance_rated",
  "data": {
    "id": 123,
    "instructor": "محمد أحمد",
    "instructor_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "rating": 8.5,
    "rated_by": "Admin User",
    "rated_by_id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
    "rated_at": "2026-02-05T15:30:00+02:00",
    "notes": "أداء ممتاز في الشرح",
    "date": "2026-02-05",
    "status": "present"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Attendance record ID |
| `instructor` | string | Instructor's full name |
| `instructor_id` | UUID | Instructor's user ID |
| `rating` | decimal | Rating value (1.00-10.00) |
| `rated_by` | string | Admin's full name who rated |
| `rated_by_id` | UUID | Admin's user ID |
| `rated_at` | datetime | When the rating was submitted |
| `notes` | string/null | Optional notes about the rating |
| `date` | date | Attendance date |
| `status` | string | Attendance status (present/late) |
```

#### `summary_response`

Response to a `request_summary` message.

```json
{
  "type": "summary_response",
  "data": {
    "date": "2026-02-05",
    "total_expected": 15,
    "checked_in": 10,
    "present": 8,
    "late": 2,
    "absent": 1
  }
}
```

#### `pong`

Response to a `ping` message.

```json
{ "type": "pong" }
```

---

## JavaScript Example

Full implementation with ticket-based auth and auto-reconnect:

```javascript
class AttendanceWebSocket {
  constructor(jwtToken) {
    this.jwtToken = jwtToken;  // Used to obtain tickets
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      // Step 1: Obtain a ticket via REST API
      const ticket = await this.obtainTicket();
      
      // Step 2: Connect with ticket
      this.socket = new WebSocket(
        `ws://localhost:8001/ws/attendance/?ticket=${ticket}`
      );

      this.socket.onopen = () => {
        console.log('Connected to attendance updates');
        this.reconnectAttempts = 0;
        this.requestSummary();
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.socket.onclose = (event) => {
        if (event.code === 4001) {
          console.error('No ticket provided');
        } else if (event.code === 4002) {
          console.error('Invalid or expired ticket');
        } else if (event.code === 4003) {
          console.error('Not authorized');
        } else {
          this.attemptReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  async obtainTicket() {
    const response = await fetch('/api/attendance/ws-ticket/', {
      method: 'POST',
      headers: {
        'Authorization': `JWT ${this.jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to obtain WebSocket ticket');
    }
    
    const data = await response.json();
    return data.ticket;
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connection_established':
        console.log('Connected as:', message.message);
        console.log('Auth method:', message.auth_method);  // 'ticket' or 'jwt'
        break;
      case 'attendance_update':
        this.onCheckIn(message.data);
        break;
      case 'attendance_check_out':
        this.onCheckOut(message.data);
        break;
      case 'attendance_rated':
        this.onRated(message.data);
        break;
      case 'summary_response':
        this.onSummary(message.data);
        break;
      case 'pong':
        console.log('Server is alive');
        break;
    }
  }

  requestSummary() {
    this.socket.send(JSON.stringify({ type: 'request_summary' }));
  }

  ping() {
    this.socket.send(JSON.stringify({ type: 'ping' }));
  }

  async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), 3000);
    }
  }

  // Override these in your app
  onCheckIn(data) { console.log('Check-in:', data); }
  onCheckOut(data) { console.log('Check-out:', data); }
  onRated(data) { console.log('Rated:', data); }
  onSummary(data) { console.log('Summary:', data); }
}

// Usage
const ws = new AttendanceWebSocket('your-jwt-token');
ws.onCheckIn = (data) => {
  showNotification(`${data.instructor} checked in`);
};
ws.connect();
```
        console.error('Invalid token');
      } else if (event.code === 4003) {
        console.error('Not authorized');
      } else {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connection_established':
        console.log('Connected as:', message.message);
        break;
      case 'attendance_update':
        this.onCheckIn(message.data);
        break;
      case 'attendance_check_out':
        this.onCheckOut(message.data);
        break;
      case 'attendance_rated':
        this.onRated(message.data);
        break;
      case 'summary_response':
        this.onSummary(message.data);
        break;
      case 'pong':
        console.log('Server is alive');
        break;
    }
  }

  requestSummary() {
    this.socket.send(JSON.stringify({ type: 'request_summary' }));
  }

  ping() {
    this.socket.send(JSON.stringify({ type: 'ping' }));
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 3000);
    }
  }

  // Override these in your app
  onCheckIn(data) { console.log('Check-in:', data); }
  onCheckOut(data) { console.log('Check-out:', data); }
  onRated(data) { console.log('Rated:', data); }
  onSummary(data) { console.log('Summary:', data); }
}

// Usage
const ws = new AttendanceWebSocket('your-jwt-token');
ws.onCheckIn = (data) => {
  showNotification(`${data.instructor} checked in`);
};
ws.connect();
```

---

## Best Practices

1. **Use WebSocket** for real-time updates instead of polling the REST API
2. **Implement reconnection logic** — the example above handles this automatically
3. **Request summary on connect** to get the current state immediately
4. **Show loading states** while the WebSocket connection is being established
5. **Handle all close codes** — `4001`/`4002`/`4003` should not trigger reconnect


---

## Manual WebSocket Testing Instructions

Here's how to test the WebSocket implementation manually:


Prerequisites


1. The backend must be running with both Gunicorn (port 8000) and Uvicorn (port 8001)
2. Redis must be running (for the channel layer)
3. You need a valid admin JWT token

### Method A: Ticket-based Authentication (Recommended)

**Step 1: Get a JWT Token**
```bash
# Login to get tokens
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"phone_number1": "+201000000001", "password": "yourpassword"}'
```

Response:
```json
{
  "refresh": "eyJ...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Step 2: Obtain a WebSocket Ticket**
```bash
curl -X POST http://localhost:8000/api/attendance/ws-ticket/ \
  -H "Authorization: JWT YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "ticket": "abc123xyz...",
  "expires_in_seconds": 30,
  "message": "Use this ticket to connect to WebSocket within 30 seconds. Single use only."
}
```

**Step 3: Connect to WebSocket (within 30 seconds)**

Using websocat:
```bash
websocat "ws://localhost:8001/ws/attendance/?ticket=YOUR_TICKET"
```

Or using wscat:
```bash
wscat -c "ws://localhost:8001/ws/attendance/?ticket=YOUR_TICKET"
```

### Method B: JWT Authentication (Legacy)

**Step 1: Get a JWT Token** (same as above)

**Step 2: Connect to WebSocket Directly**
```bash
websocat "ws://localhost:8001/ws/attendance/?token=YOUR_ACCESS_TOKEN"
```

### Expected Connection Response
```json
{
  "type": "connection_established",
  "message": "Connected as Admin User",
  "user_id": "a1b2c3d4-...",
  "auth_method": "ticket"
}
```

**Note:** The `auth_method` field will be `"ticket"` or `"jwt"` depending on which method was used.

Step 4: Test Ping/Pong
Send:

```json
{ "type": "ping" }
```
Expect:

```json
{ "type": "pong" }
```

Step 5: Request Today's Summary
Send:

```json
{ "type": "request_summary" }
```
Expect:
```json
{
  "type": "summary_response",
  "data": {
    "date": "2026-02-25",
    "total_expected": 15,
    "checked_in": 10,
    "checked_out": 3,
    "present": 8,
    "late": 2,
    "absent": 1,
    "pending": 0,
    "not_started": 4
  }
}
```

Step 6: Test Real-time Updates
Open another terminal and trigger a scan (simulating fingerprint device):
```bash
curl -X POST http://localhost:8000/api/attendance/scan/ \
  -H "Content-Type: application/json" \
  -d '{"fingerprint_id": "FP_TEST_001", "device_id": "DEVICE_TEST_001"}'
```


In your WebSocket terminal, you should receive:
```json
{
  "type": "attendance_update",
  "data": {
    "instructor": "محمد أحمد",
    "id": 123,
    "time": "2026-02-25T08:30:00+02:00",
    "status": "present",
    "date": "2026-02-25"
  }
}
```

Step 7: Test Rating Broadcast
Rate an attendance record:
```bash
curl -X POST http://localhost:8000/api/attendance/123/rate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT YOUR_ACCESS_TOKEN" \
  -d '{"rating": 8.5, "notes": "أداء ممتاز"}'
```
In your WebSocket terminal, you should receive:

```json
{
  "type": "attendance_rated",
  "data": {
    "id": 123,
    "instructor": "محمد أحمد",
    "instructor_id": "uuid...",
    "rating": 8.5,
    "rated_by": "Admin User",
    "rated_by_id": "uuid...",
    "rated_at": "2026-02-25T15:30:00+02:00",
    "notes": "أداء ممتاز",
    "date": "2026-02-25",
    "status": "present"
  }
}
```
```
