#!/usr/bin/env python3
"""
CloudBuilder Discord Bot — Automated Server Setup
═══════════════════════════════════════════════════
This bot creates all channels, roles, and categories
for the CloudBuilder Discord server.

Prerequisites:
1. Create a bot at https://discord.com/developers/applications
2. Enable "Server Members Intent" and "Message Content Intent"
3. Invite bot with permissions: Manage Channels, Manage Roles, Send Messages

Usage:
1. Set DISCORD_BOT_TOKEN in environment
2. Run: python setup-bot.py --server-id YOUR_SERVER_ID
"""

import os
import sys
import json
import asyncio
import io
from typing import Optional

# Fix Windows encoding for emoji output
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import discord
    from discord.ext import commands
except ImportError:
    print("❌ discord.py not installed. Run: pip install discord.py")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

SERVER_CONFIG = {
    "name": "CloudBuilder",
    "description": "Comunidade oficial do CloudBuilder — Platform Engineering, FinOps e Cloud",
    "categories": {
        "📢 ANÚNCIOS": {
            "type": "text",
            "channels": ["anúncios", "changelog", "eventos"],
            "permissions": {"everyone": {"send_messages": False}},
        },
        "💬 GERAL": {
            "type": "text",
            "channels": ["geral", "apresentações", "off-topic"],
        },
        "🛠️ TÉCNICO": {
            "type": "text",
            "channels": ["ajuda", "dicas", "code-review", "terraform", "kubernetes", "aws", "azure", "gcp"],
        },
        "🎯 PLATAFORMA": {
            "type": "text",
            "channels": ["cloudbuilder", "bugs", "features", "integrations"],
        },
        "💰 FINOPS": {
            "type": "text",
            "channels": ["finops", "cost-optimization", "budget"],
        },
        "📚 RECURSOS": {
            "type": "text",
            "channels": ["blog", "newsletter", "docs", "github"],
        },
        "🔒 ADMIN": {
            "type": "text",
            "channels": ["staff", "moderação"],
            "permissions": {"everyone": {"view_channel": False}},
        },
    },
    "roles": [
        {"name": "Staff", "color": 0xCCFF00, "permissions": "all"},
        {"name": "Moderador", "color": 0x0A1128, "permissions": "moderate"},
        {"name": "Beta Tester", "color": 0xE3E2FD, "permissions": "read"},
        {"name": "Contribuidor", "color": 0x00FF00, "permissions": "read"},
        {"name": "Membro", "color": 0x808080, "permissions": "read"},
    ],
    "welcome_message": """Bem-vindo ao CloudBuilder Discord! 👋

Aqui você encontra:
💬 Discussões sobre Platform Engineering
🛠️ Suporte técnico
💰 Dicas de FinOps
🤝 Networking

Comece se apresentando em <#apresentações>!""",
}


# ═══════════════════════════════════════════════════════════════
# Bot Setup
# ═══════════════════════════════════════════════════════════════

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)


async def create_roles(guild: discord.Guild):
    """Create all roles for the server."""
    print("\n📋 Creating roles...")
    
    for role_config in SERVER_CONFIG["roles"]:
        # Check if role already exists
        existing = discord.utils.get(guild.roles, name=role_config["name"])
        if existing:
            print(f"  ⏭️  Role '{role_config['name']}' already exists")
            continue
        
        # Create role
        permissions = discord.Permissions()
        if role_config["permissions"] == "all":
            permissions.administrator = True
        elif role_config["permissions"] == "moderate":
            permissions.manage_messages = True
            permissions.kick_members = True
            permissions.ban_members = True
            permissions.manage_channels = True
        
        await guild.create_role(
            name=role_config["name"],
            color=discord.Color(role_config["color"]),
            permissions=permissions,
            hoist=True,
            mentionable=True,
        )
        print(f"  ✅ Created role: {role_config['name']}")


async def create_categories_and_channels(guild: discord.Guild):
    """Create all categories and channels."""
    print("\n📁 Creating categories and channels...")
    
    for category_name, category_config in SERVER_CONFIG["categories"].items():
        # Check if category exists
        existing = discord.utils.get(guild.categories, name=category_name)
        if existing:
            print(f"  ⏭️  Category '{category_name}' already exists")
            category = existing
        else:
            # Create category
            overwrites = {}
            if category_config.get("permissions", {}).get("everyone", {}).get("view_channel") == False:
                overwrites[guild.default_role] = discord.PermissionOverwrite(view_channel=False)
            
            category = await guild.create_category(
                name=category_name,
                overwrites=overwrites,
            )
            print(f"  ✅ Created category: {category_name}")
        
        # Create channels
        for channel_name in category_config["channels"]:
            # Check if channel exists
            existing = discord.utils.get(guild.text_channels, name=channel_name)
            if existing:
                print(f"    ⏭️  Channel '#{channel_name}' already exists")
                continue
            
            # Create channel
            overwrites = {}
            if category_config.get("permissions", {}).get("everyone", {}).get("send_messages") == False:
                overwrites[guild.default_role] = discord.PermissionOverwrite(send_messages=False)
            
            await guild.create_text_channel(
                name=channel_name,
                category=category,
                overwrites=overwrites,
            )
            print(f"    ✅ Created channel: #{channel_name}")


async def create_welcome_channel(guild: discord.Guild):
    """Create welcome channel and set up welcome message."""
    print("\n👋 Setting up welcome...")
    
    # Find or create welcome channel
    welcome_channel = discord.utils.get(guild.text_channels, name="bem-vindos")
    if not welcome_channel:
        # Find the category for announcements
        announcements_category = discord.utils.get(guild.categories, name="📢 ANÚNCIOS")
        if announcements_category:
            welcome_channel = await guild.create_text_channel(
                name="bem-vindos",
                category=announcements_category,
            )
            print("  ✅ Created #bem-vindos channel")
    
    # Send welcome message
    if welcome_channel:
        await welcome_channel.send(SERVER_CONFIG["welcome_message"])
        print("  ✅ Sent welcome message")


async def setup_reaction_roles(guild: discord.Guild):
    """Set up reaction roles channel."""
    print("\n🎭 Setting up reaction roles...")
    
    # Find or create reaction-roles channel
    rr_channel = discord.utils.get(guild.text_channels, name="reaction-roles")
    if not rr_channel:
        general_category = discord.utils.get(guild.categories, name="💬 GERAL")
        if general_category:
            rr_channel = await guild.create_text_channel(
                name="reaction-roles",
                category=general_category,
            )
            print("  ✅ Created #reaction-roles channel")
    
    # Send reaction roles message
    if rr_channel:
        message = """Escolha seus interesses reagindo abaixo! 🎯

🛠️ — Platform Engineering
💰 — FinOps
☁️ — Multi-Cloud
🔒 — Security
📊 — Observability
🤖 — AIOps"""
        
        msg = await rr_channel.send(message)
        
        # Add reactions
        reactions = ["🛠️", "💰", "☁️", "🔒", "📊", "🤖"]
        for reaction in reactions:
            await msg.add_reaction(reaction)
        
        print("  ✅ Set up reaction roles")


@bot.event
async def on_ready():
    """Bot is ready — perform setup."""
    print(f"\n🤖 Logged in as {bot.user.name}")
    print(f"📊 Connected to {len(bot.guilds)} server(s)")
    
    # Get server from command line args
    server_id = None
    for arg in sys.argv:
        if arg.startswith("--server-id="):
            server_id = int(arg.split("=")[1])
    
    if not server_id:
        print("\n❌ Please provide --server-id=YOUR_SERVER_ID")
        print("   Find your server ID: Discord Settings → Advanced → Developer Mode")
        await bot.close()
        return
    
    # Get guild
    guild = bot.get_guild(server_id)
    if not guild:
        print(f"\n❌ Server with ID {server_id} not found")
        print("   Make sure the bot is invited to the server")
        await bot.close()
        return
    
    print(f"\n🏢 Setting up server: {guild.name}")
    print("=" * 50)
    
    # Perform setup
    await create_roles(guild)
    await create_categories_and_channels(guild)
    await create_welcome_channel(guild)
    await setup_reaction_roles(guild)
    
    print("\n" + "=" * 50)
    print("✅ Server setup complete!")
    print(f"🔗 Invite link: https://discord.gg/cloudbuilder")
    
    await bot.close()


def main():
    """Main entry point."""
    # Check for bot token
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("❌ DISCORD_BOT_TOKEN not set")
        print("\n📋 Steps to get a bot token:")
        print("1. Go to https://discord.com/developers/applications")
        print("2. Click 'New Application' → Name it 'CloudBuilder Bot'")
        print("3. Go to 'Bot' tab → Click 'Add Bot'")
        print("4. Enable 'Server Members Intent' and 'Message Content Intent'")
        print("5. Copy the token")
        print("6. Set it: export DISCORD_BOT_TOKEN=your_token_here")
        print("7. Invite bot: OAuth2 → URL Generator → Select 'bot' → Copy URL")
        print("   Permissions needed: Manage Channels, Manage Roles, Send Messages")
        sys.exit(1)
    
    # Check for server ID
    server_id = None
    for arg in sys.argv:
        if arg.startswith("--server-id="):
            server_id = arg.split("=")[1]
    
    if not server_id:
        print("❌ Please provide --server-id=YOUR_SERVER_ID")
        print("   Find your server ID: Discord Settings → Advanced → Developer Mode")
        sys.exit(1)
    
    print("🚀 CloudBuilder Discord Setup Bot")
    print("=" * 50)
    
    bot.run(token)


if __name__ == "__main__":
    main()
