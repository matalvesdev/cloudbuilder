#!/usr/bin/env python3
"""
CloudBuilder Discord Bot — Automated Server Setup + Commands
═════════════════════════════════════════════════════════════
Creates channels, roles, categories and runs as a persistent bot.

Usage:
  python setup-bot.py --server-id=ID                  # setup only
  python setup-bot.py --server-id=ID --keep-online     # setup + stay online
  python setup-bot.py --server-id=ID --cleanup         # delete all, then rebuild
"""

import os
import sys
import asyncio
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

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
    "categories": {
        "📢 ANÚNCIOS": {
            "channels": ["anúncios", "changelog", "eventos"],
            "permissions": {"everyone": {"send_messages": False}},
        },
        "💬 GERAL": {
            "channels": ["geral", "apresentações", "off-topic"],
        },
        "🛠️ TÉCNICO": {
            "channels": ["ajuda", "dicas", "code-review", "terraform", "kubernetes", "aws", "azure", "gcp"],
        },
        "🎯 PLATAFORMA": {
            "channels": ["cloudbuilder", "bugs", "features", "integrations"],
        },
        "💰 FINOPS": {
            "channels": ["finops", "cost-optimization", "budget"],
        },
        "📚 RECURSOS": {
            "channels": ["blog", "newsletter", "docs", "github"],
        },
        "🔒 ADMIN": {
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
        # Interest roles (for reaction roles)
        {"name": "Platform Engineering", "color": 0xFF6B35, "permissions": "read"},
        {"name": "FinOps", "color": 0x00D26A, "permissions": "read"},
        {"name": "Multi-Cloud", "color": 0x0099FF, "permissions": "read"},
        {"name": "Security", "color": 0xFF4757, "permissions": "read"},
        {"name": "Observability", "color": 0xA855F7, "permissions": "read"},
        {"name": "AIOps", "color": 0xFFD93D, "permissions": "read"},
    ],
    # welcome_message is built dynamically with channel IDs
    "reaction_roles": {
        "channel": "reaction-roles",
        "message": """Escolha seus interesses reagindo abaixo! 🎯

🛠️ — Platform Engineering
💰 — FinOps
☁️ — Multi-Cloud
🔒 — Security
📊 — Observability
🤖 — AIOps""",
        "mapping": {
            "🛠️": "Platform Engineering",
            "💰": "FinOps",
            "☁️": "Multi-Cloud",
            "🔒": "Security",
            "📊": "Observability",
            "🤖": "AIOps",
        },
    },
}


# ═══════════════════════════════════════════════════════════════
# Bot — disable default help, use custom
# ═══════════════════════════════════════════════════════════════

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.reactions = True

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)
DISCORD_INVITE_URL = os.environ.get(
    "DISCORD_INVITE_URL",
    "https://discord.gg/Sxjy9S9x8w",
)


async def get_server_invite(guild):
    """Return the official invite configured for the CloudBuilder guild."""
    return DISCORD_INVITE_URL


def build_welcome_message(member_mention, presentations_channel, reaction_roles_channel, invite_url):
    """Build the welcome copy using Discord's clickable channel mentions."""
    greeting = (
        f"Boas-vindas à comunidade CloudBuilder, {member_mention}! 👋"
        if member_mention
        else "Boas-vindas à comunidade CloudBuilder! 👋"
    )
    lines = [
        greeting,
        "",
        "Que bom ter você por aqui! Este é o nosso espaço para aprender, "
        "trocar experiências e evoluir juntos em Platform Engineering, FinOps e Cloud.",
        "",
    ]
    if presentations_channel:
        lines.append(
            f"🚀 Apresente-se em {presentations_channel.mention} e conte um pouco sobre você."
        )
    if reaction_roles_channel:
        lines.append(
            f"🎯 Escolha seus interesses em {reaction_roles_channel.mention} "
            "para personalizar sua experiência."
        )
    lines.extend(
        [
            "",
            f"🤝 Conhece alguém que vai curtir a comunidade? Convide: {invite_url}",
            "",
            "Sinta-se em casa — estamos felizes em ter você com a gente! 💚",
        ]
    )
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════
# Commands
# ═══════════════════════════════════════════════════════════════

@bot.command(name="ajuda")
async def ajuda_cmd(ctx):
    """Mostra todos os comandos disponíveis."""
    embed = discord.Embed(
        title="📋 Comandos CloudBuilder",
        description="Use qualquer um desses comandos:",
        color=discord.Color(0x0A1128),
    )
    commands_list = [
        ("!ajuda", "Mostra esta mensagem"),
        ("!blog", "Blog oficial do CloudBuilder"),
        ("!newsletter", "Inscreva-se na newsletter"),
        ("!invite", "Link de convite do servidor"),
        ("!status", "Status do sistema"),
        ("!docs", "Documentação do CloudBuilder"),
        ("!info", "Informações do servidor"),
    ]
    for name, desc in commands_list:
        embed.add_field(name=name, value=desc, inline=False)
    embed.set_footer(text="CloudBuilder — Platform Engineering & FinOps")
    await ctx.send(embed=embed)


@bot.command(name="blog")
async def blog_cmd(ctx):
    """Blog oficial."""
    embed = discord.Embed(
        title="📝 Blog CloudBuilder",
        description="Leia nossos artigos sobre Platform Engineering, FinOps e Cloud",
        url="https://cloudbuilder.io/blog",
        color=discord.Color(0x00D26A),
    )
    await ctx.send(embed=embed)


@bot.command(name="newsletter")
async def newsletter_cmd(ctx):
    """Newsletter."""
    embed = discord.Embed(
        title="📧 Newsletter CloudBuilder",
        description="Inscreva-se para receber conteúdo exclusivo",
        url="https://cloudbuilder.io/newsletter",
        color=discord.Color(0x0099FF),
    )
    await ctx.send(embed=embed)


@bot.command(name="invite")
async def invite_cmd(ctx):
    """Link de convite."""
    try:
        invite_url = await get_server_invite(ctx.guild)
    except (discord.Forbidden, discord.HTTPException, RuntimeError):
        await ctx.send("Não foi possível gerar o link de convite. Avise a equipe de moderação.")
        return

    embed = discord.Embed(
        title="🔗 Convide Amigos",
        description=invite_url,
        color=discord.Color(0xFF6B35),
    )
    await ctx.send(embed=embed)


@bot.command(name="status")
async def status_cmd(ctx):
    """Status do sistema."""
    embed = discord.Embed(
        title="🟢 CloudBuilder — Status",
        description="Todos os sistemas operacionais",
        color=discord.Color(0x00D26A),
    )
    embed.add_field(name="Frontend", value="✅ Online", inline=True)
    embed.add_field(name="Backend", value="✅ Online", inline=True)
    embed.add_field(name="API", value="✅ Online", inline=True)
    await ctx.send(embed=embed)


@bot.command(name="docs")
async def docs_cmd(ctx):
    """Documentação."""
    embed = discord.Embed(
        title="📖 Documentação",
        description="Acesse a documentação completa",
        url="https://cloudbuilder.io/docs",
        color=discord.Color(0xA855F7),
    )
    await ctx.send(embed=embed)


@bot.command(name="info")
async def info_cmd(ctx):
    """Info do servidor."""
    guild = ctx.guild
    embed = discord.Embed(
        title="ℹ️ CloudBuilder Discord",
        description=guild.description or "Comunidade oficial",
        color=discord.Color(0x0A1128),
    )
    embed.add_field(name="Membros", value=str(guild.member_count), inline=True)
    embed.add_field(name="Canais", value=str(len(guild.channels)), inline=True)
    await ctx.send(embed=embed)


# ═══════════════════════════════════════════════════════════════
# Reaction Roles — auto assign/remove
# ═══════════════════════════════════════════════════════════════

@bot.event
async def on_raw_reaction_add(payload):
    """Auto-assign role when user reacts."""
    if payload.member.bot:
        return

    mapping = SERVER_CONFIG["reaction_roles"]["mapping"]
    role_name = mapping.get(str(payload.emoji))
    if not role_name:
        return

    guild = bot.get_guild(payload.guild_id)
    role = discord.utils.get(guild.roles, name=role_name)
    if role:
        await payload.member.add_roles(role, reason="Reaction role")


@bot.event
async def on_raw_reaction_remove(payload):
    """Auto-remove role when user removes reaction."""
    if payload.member.bot:
        return

    mapping = SERVER_CONFIG["reaction_roles"]["mapping"]
    role_name = mapping.get(str(payload.emoji))
    if not role_name:
        return

    guild = bot.get_guild(payload.guild_id)
    role = discord.utils.get(guild.roles, name=role_name)
    if role:
        await payload.member.remove_roles(role, reason="Reaction role removed")


# ═══════════════════════════════════════════════════════════════
# Welcome message
# ═══════════════════════════════════════════════════════════════

@bot.event
async def on_member_join(member):
    """Welcome message when a new member joins."""
    channel = discord.utils.get(member.guild.text_channels, name="bem-vindos")
    if not channel:
        return

    # Find channel IDs for mentions
    apresentacoes = discord.utils.get(member.guild.text_channels, name="apresentações")
    reaction_roles = discord.utils.get(member.guild.text_channels, name="reaction-roles")

    try:
        invite_url = await get_server_invite(member.guild)
    except (discord.Forbidden, discord.HTTPException, RuntimeError):
        invite_url = "Solicite um convite à equipe de moderação."

    await channel.send(build_welcome_message(member.mention, apresentacoes, reaction_roles, invite_url))


# ═══════════════════════════════════════════════════════════════
# Setup Functions
# ═══════════════════════════════════════════════════════════════

async def cleanup_server(guild):
    """Delete everything."""
    print("\n🧹 Cleaning up...")
    for ch in list(guild.text_channels) + list(guild.voice_channels):
        try:
            await ch.delete()
        except Exception:
            pass
    for cat in guild.categories:
        try:
            await cat.delete()
        except Exception:
            pass
    for role in guild.roles:
        if role.name != "@everyone" and not role.is_bot_managed():
            try:
                await role.delete()
            except Exception:
                pass
    print("  ✅ Cleanup done!")


async def create_roles(guild):
    print("\n📋 Creating roles...")
    for rc in SERVER_CONFIG["roles"]:
        if discord.utils.get(guild.roles, name=rc["name"]):
            print(f"  ⏭️  {rc['name']} exists")
            continue
        perms = discord.Permissions()
        if rc["permissions"] == "all":
            perms.administrator = True
        elif rc["permissions"] == "moderate":
            perms.manage_messages = True
            perms.kick_members = True
            perms.ban_members = True
        await guild.create_role(
            name=rc["name"],
            color=discord.Color(rc["color"]),
            permissions=perms,
            hoist=True,
            mentionable=True,
        )
        print(f"  ✅ {rc['name']}")


async def create_categories_and_channels(guild):
    print("\n📁 Creating categories & channels...")
    for cat_name, cat_cfg in SERVER_CONFIG["categories"].items():
        cat = discord.utils.get(guild.categories, name=cat_name)
        if not cat:
            ow = {}
            if cat_cfg.get("permissions", {}).get("everyone", {}).get("view_channel") is False:
                ow[guild.default_role] = discord.PermissionOverwrite(view_channel=False)
            cat = await guild.create_category(name=cat_name, overwrites=ow)
            print(f"  ✅ {cat_name}")
        else:
            print(f"  ⏭️  {cat_name} exists")

        for ch_name in cat_cfg["channels"]:
            if discord.utils.get(guild.text_channels, name=ch_name):
                print(f"    ⏭️  #{ch_name}")
                continue
            ow = {}
            if cat_cfg.get("permissions", {}).get("everyone", {}).get("send_messages") is False:
                ow[guild.default_role] = discord.PermissionOverwrite(send_messages=False)
            await guild.create_text_channel(name=ch_name, category=cat, overwrites=ow)
            print(f"    ✅ #{ch_name}")


async def setup_welcome(guild):
    print("\n👋 Setting up welcome...")
    ch = discord.utils.get(guild.text_channels, name="bem-vindos")
    if not ch:
        cat = discord.utils.get(guild.categories, name="📢 ANÚNCIOS")
        if cat:
            ch = await guild.create_text_channel("bem-vindos", category=cat)
    if ch:
        ap = discord.utils.get(guild.text_channels, name="apresentações")
        rr = discord.utils.get(guild.text_channels, name="reaction-roles")
        try:
            invite_url = await get_server_invite(guild)
        except (discord.Forbidden, discord.HTTPException, RuntimeError):
            invite_url = "Solicite um convite à equipe de moderação."
        msg = build_welcome_message(None, ap, rr, invite_url)
        async for existing_message in ch.history(limit=100):
            if existing_message.author == guild.me and existing_message.content.startswith(
                ("Bem-vindo ao CloudBuilder Discord", "Boas-vindas à comunidade CloudBuilder")
            ):
                await existing_message.edit(content=msg)
                print("  ✅ Welcome updated")
                break
        else:
            await ch.send(msg)
            print("  ✅ Welcome sent")


async def setup_reaction_roles(guild):
    print("\n🎭 Setting up reaction roles...")
    cfg = SERVER_CONFIG["reaction_roles"]
    ch = discord.utils.get(guild.text_channels, name=cfg["channel"])
    if not ch:
        cat = discord.utils.get(guild.categories, name="💬 GERAL")
        if cat:
            ch = await guild.create_text_channel(cfg["channel"], category=cat)
    if ch:
        msg = None
        async for existing_message in ch.history(limit=100):
            if existing_message.author == guild.me and existing_message.content.startswith(
                "Escolha seus interesses reagindo abaixo!"
            ):
                msg = existing_message
                if msg.content != cfg["message"]:
                    await msg.edit(content=cfg["message"])
                break
        if msg is None:
            msg = await ch.send(cfg["message"])
        for emoji in cfg["mapping"]:
            await msg.add_reaction(emoji)
        print("  ✅ Reaction roles set")


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

@bot.event
async def on_ready():
    print(f"\n🤖 Logged in as {bot.user.name}")
    print(f"📊 Connected to {len(bot.guilds)} server(s)")

    server_id = None
    cleanup = "--cleanup" in sys.argv
    keep_online = "--keep-online" in sys.argv

    for arg in sys.argv:
        if arg.startswith("--server-id="):
            server_id = int(arg.split("=")[1])

    if not server_id:
        print("❌ Provide --server-id=ID")
        await bot.close()
        return

    guild = bot.get_guild(server_id)
    if not guild:
        print(f"❌ Server {server_id} not found")
        for available_guild in bot.guilds:
            print(f"   Available: {available_guild.name} ({available_guild.id})")
        await bot.close()
        return

    print(f"\n🏢 {guild.name}")
    print("=" * 50)

    if cleanup:
        await cleanup_server(guild)

    await create_roles(guild)
    await create_categories_and_channels(guild)
    await setup_reaction_roles(guild)
    await setup_welcome(guild)

    print("\n" + "=" * 50)
    print("✅ Setup complete!")
    print("📋 Commands: !ajuda !blog !newsletter !invite !status !docs !info")

    if keep_online:
        print("\n🟢 Bot online — Ctrl+C to stop")
    else:
        await bot.close()


def main():
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("❌ DISCORD_BOT_TOKEN not set")
        sys.exit(1)

    if "--server-id=" not in " ".join(sys.argv):
        print("❌ Provide --server-id=ID")
        sys.exit(1)

    print("🚀 CloudBuilder Discord Bot")
    print("=" * 50)
    bot.run(token)


if __name__ == "__main__":
    main()
