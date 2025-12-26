import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/utils/admin-auth'

// This route is for initial admin setup only
// In production, you might want to disable this after first use

export async function POST(request: Request) {
  try {
    const { password, setupKey } = await request.json()

    // Simple setup key protection - in production, use environment variable
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY || 'omosaball-setup-2024'
    if (setupKey !== expectedSetupKey) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 401 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Check if admin already exists
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('id')
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Admin already configured' },
        { status: 400 }
      )
    }

    // Hash password and store
    const passwordHash = await hashPassword(password)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('admin_settings')
      .insert({
        id: 1,
        password_hash: passwordHash,
      })

    if (insertError) {
      console.error('Error setting up admin:', insertError)
      return NextResponse.json(
        { error: 'Failed to setup admin' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Admin configured successfully' })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during setup' },
      { status: 500 }
    )
  }
}
