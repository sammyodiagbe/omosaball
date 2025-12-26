# RSVP System Overhaul - Implementation Guide

## Overview
Transform the RSVP system to allow guest RSVPs (no account needed), add payment tracking, enable real-time updates, and change max players to 32.

---

## 1. DATABASE MIGRATION

Apply this migration via Supabase MCP or SQL editor:

```sql
-- Migration: 002_guest_rsvp_and_payment

-- Make player_id nullable (for guests)
ALTER TABLE rsvps ALTER COLUMN player_id DROP NOT NULL;

-- Add guest fields
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_position TEXT CHECK (guest_position IN ('defender', 'midfielder', 'attacker'));

-- Add payment tracking
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Constraint: either player_id OR guest info required
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvps_player_or_guest;
ALTER TABLE rsvps ADD CONSTRAINT rsvps_player_or_guest
  CHECK (player_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL AND guest_position IS NOT NULL));

-- Unique constraint for guests (one phone per game)
DROP INDEX IF EXISTS rsvps_guest_unique;
CREATE UNIQUE INDEX rsvps_guest_unique ON rsvps(game_id, guest_phone) WHERE player_id IS NULL;

-- Update default max_players
ALTER TABLE games ALTER COLUMN max_players SET DEFAULT 32;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rsvps;

-- Update RLS: Allow anonymous inserts for guests
DROP POLICY IF EXISTS "Anyone can insert guest RSVP" ON rsvps;
CREATE POLICY "Anyone can insert guest RSVP" ON rsvps
  FOR INSERT WITH CHECK (player_id IS NULL AND guest_name IS NOT NULL);

-- Keep existing policies for authenticated users
```

**Project ID:** `hflhrxunelatkeijfzvz`

---

## 2. UPDATE TYPES

File: `lib/types/database.ts`

Add/update RSVP type to include:
- `player_id: string | null` (nullable for guests)
- `guest_name: string | null`
- `guest_phone: string | null`
- `guest_position: 'defender' | 'midfielder' | 'attacker' | null`
- `has_paid: boolean`
- `paid_at: string | null`

---

## 3. CREATE REALTIME HOOK

Create file: `lib/hooks/useRealtimeRSVPs.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RSVP {
  id: string
  game_id: string
  player_id: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_position: string | null
  status: string
  has_paid: boolean
  paid_at: string | null
  profiles?: {
    id: string
    full_name: string
    preferred_position: string
  } | null
}

export function useRealtimeRSVPs(gameId: string, initialRSVPs: RSVP[]) {
  const [rsvps, setRSVPs] = useState<RSVP[]>(initialRSVPs)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`rsvps:${gameId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `game_id=eq.${gameId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full RSVP with profile data
            const { data } = await supabase
              .from('rsvps')
              .select('*, profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) setRSVPs(prev => [...prev, data])
          } else if (payload.eventType === 'UPDATE') {
            setRSVPs(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r))
          } else if (payload.eventType === 'DELETE') {
            setRSVPs(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId])

  return rsvps
}
```

---

## 4. UPDATE RSVP API

File: `app/api/games/[id]/rsvp/route.ts`

Changes:
- Remove auth requirement for POST
- Accept guest data: `{ guest_name, guest_phone, guest_position }`
- If guest data provided, create RSVP with `player_id: null`
- All RSVPs start as `status: 'pending'`
- Check for duplicate phone number per game

---

## 5. UPDATE RSVPButtons COMPONENT

File: `components/games/RSVPButtons.tsx`

Changes:
- Show guest form with: name, phone, position dropdown
- No login required
- Submit creates guest RSVP
- Show success message: "RSVP submitted! Waiting for admin confirmation."
- Position options: defender, midfielder, attacker

---

## 6. UPDATE ADMIN PlayerActions

File: `components/admin/PlayerActions.tsx`

Add:
- "Mark Paid" / "Mark Unpaid" toggle button
- API call to toggle `has_paid` field
- Visual indicator for payment status

---

## 7. UPDATE ADMIN GAME DETAIL PAGE

File: `app/(admin)/admin/games/[id]/page.tsx`

Changes:
- Make it real-time using `useRealtimeRSVPs` hook
- Show guest_name/guest_phone for guest RSVPs
- Show payment status badge (Paid/Unpaid)
- Show guest_position for guests
- Payment toggle per player

---

## 8. UPDATE PUBLIC GAME PAGE

File: `app/(public)/games/[id]/page.tsx`

Changes:
- Make it real-time using `useRealtimeRSVPs` hook
- Remove login requirement
- Show RSVPButtons directly (guest form)
- Display guest names in player lists
- Show real-time counts

---

## 9. UPDATE NEW GAME DEFAULTS

File: `app/(admin)/admin/games/new/page.tsx`

Change: `maxPlayers: 40` → `maxPlayers: 32`

---

## Key Rules

- Guest RSVP requires: name + phone + position
- All RSVPs start as "pending"
- One RSVP per phone per game (guests)
- One RSVP per user per game (registered)
- Max 32 players (8 per team × 4 teams)
- Admin confirms/rejects RSVPs
- Admin toggles payment status
- Admin can remove anyone

---

## Design System (for new components)

Use CSS variables from globals.css:
- `var(--background)` - warm off-white
- `var(--foreground)` - dark text
- `var(--accent)` - emerald green
- `var(--border)` - subtle border
- Font: `font-[family-name:var(--font-display)]` for headings
