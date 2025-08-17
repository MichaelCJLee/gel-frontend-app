#!/usr/bin/env python3
"""
Quick fix for streaming timeout issues
"""

import os
import sys

def update_config_timeouts():
    """Update configuration timeouts to handle longer operations"""
    
    config_file = "fastapi_service/config.py"
    
    if not os.path.exists(config_file):
        print(f"❌ Config file not found: {config_file}")
        return False
    
    # Read current config
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Update timeouts
    updates = [
        # Increase agent timeout from 300 to 900 seconds (15 minutes)
        ('agent_timeout: int = Field(default=300,', 'agent_timeout: int = Field(default=900,'),
        
        # Increase stream timeout from 600 to 1800 seconds (30 minutes)
        ('stream_timeout: int = Field(default=600,', 'stream_timeout: int = Field(default=1800,'),
        
        # Increase connection timeout from 600 to 1800 seconds (30 minutes)
        ('connection_timeout: int = Field(default=600,', 'connection_timeout: int = Field(default=1800,'),
    ]
    
    updated = False
    for old, new in updates:
        if old in content:
            content = content.replace(old, new)
            updated = True
            print(f"✅ Updated: {old.split('=')[0].strip()}")
        else:
            print(f"⚠️ Not found: {old.split('=')[0].strip()}")
    
    if updated:
        # Backup original
        backup_file = f"{config_file}.backup"
        with open(backup_file, 'w') as f:
            with open(config_file, 'r') as orig:
                f.write(orig.read())
        print(f"📁 Backup created: {backup_file}")
        
        # Write updated config
        with open(config_file, 'w') as f:
            f.write(content)
        print(f"✅ Updated config file: {config_file}")
        return True
    else:
        print("❌ No updates made")
        return False

def add_environment_variables():
    """Add environment variables for timeout configuration"""
    
    env_file = ".env"
    
    env_vars = [
        "# Streaming timeout configuration",
        "AGENT_TIMEOUT=900",
        "STREAM_TIMEOUT=1800", 
        "CONNECTION_TIMEOUT=1800",
        "MAX_CONNECTIONS=100",
        ""
    ]
    
    # Check if .env exists
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            existing_content = f.read()
        
        # Only add if not already present
        if "AGENT_TIMEOUT" not in existing_content:
            with open(env_file, 'a') as f:
                f.write('\n'.join(env_vars))
            print(f"✅ Added timeout variables to {env_file}")
        else:
            print(f"⚠️ Timeout variables already exist in {env_file}")
    else:
        with open(env_file, 'w') as f:
            f.write('\n'.join(env_vars))
        print(f"✅ Created {env_file} with timeout variables")

def show_restart_instructions():
    """Show instructions for restarting the server"""
    
    print("\n" + "="*50)
    print("🔄 RESTART REQUIRED")
    print("="*50)
    print("To apply the timeout changes:")
    print("1. Stop the FastAPI server (Ctrl+C)")
    print("2. Restart it with: python -m fastapi_service.main")
    print("3. Try your streaming request again")
    print("\n💡 The new timeouts are:")
    print("   - Agent timeout: 15 minutes")
    print("   - Stream timeout: 30 minutes") 
    print("   - Connection timeout: 30 minutes")
    print("="*50)

if __name__ == "__main__":
    print("🔧 Fixing streaming timeout issues...")
    print("-" * 40)
    
    # Update config file
    config_updated = update_config_timeouts()
    
    # Add environment variables
    add_environment_variables()
    
    if config_updated:
        show_restart_instructions()
        print("\n✅ Fix applied successfully!")
    else:
        print("\n❌ Fix could not be applied. Please check the config file manually.")
        sys.exit(1)
