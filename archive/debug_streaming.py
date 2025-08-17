#!/usr/bin/env python3
"""
Debug script to test LangGraph streaming connection issues
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

async def test_streaming_connection():
    """Test the streaming endpoint directly"""
    
    # Test data - adjust these values based on your setup
    BASE_URL = "http://localhost:8000"
    
    # You'll need to get a valid JWT token from your frontend
    # Check browser DevTools -> Application -> Local Storage for auth tokens
    JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"  # Replace with actual token
    
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    }
    
    payload = {
        "message": "Hello, this is a test message",
        "stream_mode": "updates",
        "use_persistent_memory": True,
        "include_metadata": True
    }
    
    print(f"🔍 Testing streaming connection to {BASE_URL}/api/v1/chat/stream")
    print(f"📝 Payload: {json.dumps(payload, indent=2)}")
    print(f"🔑 Using JWT: {JWT_TOKEN[:20]}..." if JWT_TOKEN != "YOUR_JWT_TOKEN_HERE" else "❌ No JWT token provided")
    print("-" * 50)
    
    try:
        timeout = aiohttp.ClientTimeout(total=30)  # 30 second timeout
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            print(f"⏰ {datetime.now()} - Starting request...")
            
            async with session.post(
                f"{BASE_URL}/api/v1/chat/stream",
                headers=headers,
                json=payload
            ) as response:
                
                print(f"📊 Response status: {response.status}")
                print(f"📋 Response headers: {dict(response.headers)}")
                
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ Error response: {error_text}")
                    return
                
                print("🔄 Starting to read stream...")
                chunk_count = 0
                
                async for line in response.content:
                    chunk_count += 1
                    line_str = line.decode('utf-8').strip()
                    
                    if line_str:
                        print(f"📦 Chunk {chunk_count}: {line_str[:100]}...")
                        
                        # Parse SSE data
                        if line_str.startswith('data: '):
                            try:
                                data = json.loads(line_str[6:])
                                event_type = data.get('type', 'unknown')
                                print(f"   ✅ Event: {event_type}")
                                
                                if event_type == 'stream_complete':
                                    print("🎉 Stream completed successfully!")
                                    break
                                    
                            except json.JSONDecodeError as e:
                                print(f"   ⚠️ JSON parse error: {e}")
                    
                    # Safety limit
                    if chunk_count > 50:
                        print("⚠️ Stopping after 50 chunks for safety")
                        break
                
                print(f"✅ Stream finished. Total chunks: {chunk_count}")
                
    except asyncio.TimeoutError:
        print("⏰ Request timed out")
    except aiohttp.ClientConnectorError as e:
        print(f"🔌 Connection error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

async def test_health_endpoint():
    """Test if the server is responding at all"""
    
    BASE_URL = "http://localhost:8000"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/api/v1/health") as response:
                print(f"🏥 Health check: {response.status}")
                if response.status == 200:
                    text = await response.text()
                    print(f"   Response: {text}")
                    return True
                else:
                    print(f"   Error: {await response.text()}")
                    return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 LangGraph Streaming Debug Tool")
    print("=" * 50)
    
    # Test health first
    print("1. Testing server health...")
    health_ok = asyncio.run(test_health_endpoint())
    
    if not health_ok:
        print("❌ Server health check failed. Make sure the server is running.")
        sys.exit(1)
    
    print("\n2. Testing streaming endpoint...")
    
    # Check if JWT token is provided
    if len(sys.argv) > 1:
        # Allow passing JWT token as command line argument
        jwt_token = sys.argv[1]
        # Update the script with the token
        with open(__file__, 'r') as f:
            content = f.read()
        
        content = content.replace('JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"', f'JWT_TOKEN = "{jwt_token}"')
        
        with open(__file__, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated JWT token: {jwt_token[:20]}...")
    
    asyncio.run(test_streaming_connection())
