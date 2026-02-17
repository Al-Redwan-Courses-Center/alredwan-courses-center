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

## Connection

```
ws://<host>:8001/ws/attendance/?token=<jwt_access_token>
```

> **Note:** WebSocket connections use port **8001**, not 8000.

| | |
|--|--|
| **Protocol** | WebSocket |
| **Port** | 8001 |
| **Auth** | JWT access token (query string) |
| **Required Role** | Admin / Staff |

### Close Codes

| Code | Meaning |
|------|---------|
| Normal | Disconnected normally |
| `4001` | No token provided |
| `4002` | Invalid token |
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

Sent when an admin rates an attendance record.

```json
{
  "type": "attendance_rated",
  "data": {
    "id": 123,
    "rating": 8.5,
    "rated_by": "Admin User"
  }
}
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

Full implementation with auto-reconnect:

```javascript
class AttendanceWebSocket {
  constructor(accessToken) {
    this.token = accessToken;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.socket = new WebSocket(
      `ws://localhost:8000/ws/attendance/?token=${this.token}`
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
        console.error('No token provided');
      } else if (event.code === 4002) {
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
