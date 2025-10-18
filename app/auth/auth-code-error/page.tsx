export default function AuthCodeError() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground">
          There was an error confirming your email. Please try signing in again.
        </p>
      </div>
    </div>
  )
}
