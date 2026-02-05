#!/usr/bin/env python3
"""
WebSocket Test Script for Instructor Attendance

This script tests the WebSocket connection for real-time attendance updates.

Usage:
    # Install websockets first: pip install websockets
    python scripts/test_websocket.py <jwt_token>
    
Example:
    python scripts/test_websocket.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
"""
import asyncio
import json
import sys

try:
    import websockets
except ImportError:
    print("Please install websockets: pip install websockets")
    sys.exit(1)


async def test_websocket(token: str):
    """Test WebSocket connection with JWT authentication."""
    uri = f"ws://localhost:8000/ws/attendance/?token={token}"

    print(f"Connecting to: {uri[:50]}...")

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")

            # Wait for welcome message
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(response)
            print(f"📩 Welcome message: {json.dumps(data, indent=2)}")

            # Test ping
            print("\n📤 Sending ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(response)
            print(f"📩 Response: {json.dumps(data, indent=2)}")

            # Request summary
            print("\n📤 Requesting today's summary...")
            await websocket.send(json.dumps({"type": "request_summary"}))
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(response)
            print(f"📩 Summary: {json.dumps(data, indent=2)}")

            print("\n✅ All tests passed!")
            print("\n⏳ Listening for real-time updates (press Ctrl+C to stop)...")

            # Keep listening for updates
            while True:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=30)
                    data = json.loads(response)
                    print(f"\n📩 Update received: {json.dumps(data, indent=2)}")
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    await websocket.send(json.dumps({"type": "ping"}))

    except websockets.exceptions.ConnectionClosedError as e:
        if e.code == 4001:
            print("❌ Connection rejected: No token provided")
        elif e.code == 4002:
            print("❌ Connection rejected: Invalid token")
        elif e.code == 4003:
            print("❌ Connection rejected: Not authorized (not staff)")
        else:
            print(f"❌ Connection closed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_websocket.py <jwt_token>")
        print("\nGet a token by running:")
        print("  curl -X POST http://localhost:8000/api/auth/jwt/create/ \\")
        print("    -H 'Content-Type: application/json' \\")
        print(
            "    -d '{\"phone_number1\": \"+201000000001\", \"password\": \"your_password\"}'")
        sys.exit(1)

    token = sys.argv[1]

    try:
        asyncio.run(test_websocket(token))
    except KeyboardInterrupt:
        print("\n\n👋 Disconnected")


if __name__ == "__main__":
    main()
