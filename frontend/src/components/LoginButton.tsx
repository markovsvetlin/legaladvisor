"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"

export function LoginButton() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testProtectedRoute = async () => {
    setIsLoading(true)
    setTestResult("")
    
    try {
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      if (!sessionData?.user) {
        setTestResult("❌ No session found")
        return
      }

      // Get the JWT token (NextAuth v5 stores it differently)
      const tokenResponse = await fetch('/api/auth/jwt')
      let token = ""
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        token = tokenData.token
      } else {
        // Fallback: try to get token from session
        token = (sessionData as any)?.accessToken || "dummy-token"
      }

      // Test the protected backend route
      const backendResponse = await fetch('http://localhost:3001/api/protected', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        setTestResult(`✅ Protected route success: ${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await backendResponse.text()
        setTestResult(`❌ Protected route failed (${backendResponse.status}): ${errorText}`)
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") return <p>Loading...</p>

  if (session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <p>Hello {session.user?.name}</p>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={testProtectedRoute}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "🔒 Test Protected Route"}
          </button>
          
          {testResult && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-w-2xl">
              {testResult}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return (
    <button 
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  )
}
