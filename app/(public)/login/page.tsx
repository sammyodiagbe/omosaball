import Link from 'next/link'
import { LoginForm } from '@/components/auth'
import { Card, CardContent, CardHeader } from '@/components/ui'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-green-600">
            OmosaBall
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Player Login</h2>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-green-600 hover:text-green-500">
            Sign up
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}
