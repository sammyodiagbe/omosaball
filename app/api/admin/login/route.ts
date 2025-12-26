import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyAdminPassword, setAdminSession } from '@/lib/utils/admin-auth'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get admin settings
    const { data: adminSettings, error: fetchError } = await supabase
      .from('admin_settings')
      .select('password_hash')
      .single()

    if (fetchError || !adminSettings) {
      // If no admin password is set, this might be first-time setup
      // For security, we'll return a generic error
      return NextResponse.json(
        { error: 'Admin not configured. Please run setup.' },
        { status: 401 }
      )
    }

    // Verify password
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await verifyAdminPassword(password, (adminSettings as any).password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Set admin session cookie
    await setAdminSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    )
  }
}
