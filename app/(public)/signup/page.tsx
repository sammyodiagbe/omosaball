import Link from 'next/link'
import { SignupForm } from '@/components/auth'
import { Card, CardContent, CardHeader } from '@/components/ui'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-green-600">
            OmosaBall
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-gray-600">
            Join the Tuesday/Thursday pickup crew
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Player Registration</h2>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
