#!/usr/bin/env python3
"""
CloudBuilder Discord — First Members Inviter
══════════════════════════════════════════════
Sends personalized invitations to first members.

Usage:
1. Create a CSV file with columns: name, email, source
2. Run: python invite-first-members.py --csv contacts.csv
"""

import os
import sys
import csv
import argparse
from typing import List, Dict
from dataclasses import dataclass

try:
    import requests
except ImportError:
    print("❌ requests not installed. Run: pip install requests")
    sys.exit(1)


@dataclass
class Contact:
    name: str
    email: str
    source: str


# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

PLUNK_API_KEY = os.environ.get("PLUNK_API_KEY", "")
DISCORD_INVITE_URL = "https://discord.gg/cloudbuilder"

INVITE_TEMPLATE = """
Olá {name}!

Estamos criando a comunidade CloudBuilder no Discord e gostaríamos que você fizesse parte!

Lá você encontra:
✅ Discussões sobre Platform Engineering
✅ Suporte técnico para Terraform, K8s, AWS
✅ Dicas de FinOps e otimização de custos
✅ Networking com outros profissionais
✅ Eventos exclusivos (Office Hours, Tech Talks)

O CloudBuilder é uma plataforma que reúne Design Visual, FinOps e IA 
para gerenciar infraestrutura multi-cloud em um só lugar.

Link de convite: {invite_url}

Esperamos você lá! 👋

Equipe CloudBuilder
"""


def load_contacts(csv_path: str) -> List[Contact]:
    """Load contacts from CSV file."""
    contacts = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            contacts.append(Contact(
                name=row.get('name', ''),
                email=row.get('email', ''),
                source=row.get('source', 'manual'),
            ))
    
    return contacts


def send_invitation(contact: Contact, dry_run: bool = False) -> bool:
    """Send invitation email via Plunk."""
    if not PLUNK_API_KEY and not dry_run:
        print("❌ PLUNK_API_KEY not set")
        return False
    
    # Format message
    message = INVITE_TEMPLATE.format(
        name=contact.name or "Developer",
        invite_url=DISCORD_INVITE_URL,
    )
    
    if dry_run:
        print(f"\n📧 [DRY RUN] Would send to: {contact.email}")
        print(f"   Subject: Convidamos você para o CloudBuilder Discord! 🚀")
        print(f"   Message preview: {message[:100]}...")
        return True
    
    # Send via Plunk
    response = requests.post(
        "https://next-api.useplunk.com/v1/send",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {PLUNK_API_KEY}",
        },
        json={
            "to": contact.email,
            "subject": "Convidamos você para o CloudBuilder Discord! 🚀",
            "body": message,
        },
    )
    
    if response.status_code == 200:
        print(f"✅ Sent to: {contact.email}")
        return True
    else:
        print(f"❌ Failed to send to {contact.email}: {response.text}")
        return False


def track_contact(contact: Contact):
    """Track contact in Plunk for analytics."""
    if not PLUNK_API_KEY:
        return
    
    requests.post(
        "https://next-api.useplunk.com/contacts",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {PLUNK_API_KEY}",
        },
        json={
            "email": contact.email,
            "subscribed": True,
            "data": {
                "name": contact.name,
                "source": f"discord-invite-{contact.source}",
            },
        },
    )


def main():
    parser = argparse.ArgumentParser(description="Invite first members to Discord")
    parser.add_argument("--csv", required=True, help="Path to CSV file with contacts")
    parser.add_argument("--dry-run", action="store_true", help="Preview without sending")
    parser.add_argument("--limit", type=int, help="Limit number of invitations")
    
    args = parser.parse_args()
    
    print("🚀 CloudBuilder Discord — First Members Inviter")
    print("=" * 50)
    
    # Load contacts
    try:
        contacts = load_contacts(args.csv)
    except FileNotFoundError:
        print(f"❌ File not found: {args.csv}")
        sys.exit(1)
    
    print(f"\n📋 Loaded {len(contacts)} contacts from {args.csv}")
    
    if args.limit:
        contacts = contacts[:args.limit]
        print(f"   Limited to {args.limit} invitations")
    
    # Preview
    print("\n👥 Contacts to invite:")
    for i, contact in enumerate(contacts, 1):
        print(f"   {i}. {contact.name} <{contact.email}> ({contact.source})")
    
    if args.dry_run:
        print("\n⚠️  DRY RUN MODE — No emails will be sent")
    
    # Send invitations
    print("\n📧 Sending invitations...")
    success_count = 0
    
    for contact in contacts:
        if send_invitation(contact, dry_run=args.dry_run):
            success_count += 1
            track_contact(contact)
    
    # Summary
    print("\n" + "=" * 50)
    print(f"✅ Summary:")
    print(f"   Total: {len(contacts)}")
    print(f"   Sent: {success_count}")
    print(f"   Failed: {len(contacts) - success_count}")
    
    if not args.dry_run and success_count > 0:
        print("\n📊 Next steps:")
        print("   1. Check Plunk dashboard for delivery status")
        print("   2. Monitor Discord for new members")
        print("   3. Welcome new members in #apresentações")


if __name__ == "__main__":
    main()
