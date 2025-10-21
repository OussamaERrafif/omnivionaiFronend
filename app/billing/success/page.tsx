"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, Crown, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function BillingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionUpdated, setSubscriptionUpdated] = useState(false)

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Check if payment was successful
        const checkoutId = searchParams.get('checkout_id')

        if (checkoutId) {
          // Verify the payment with Lemon Squeezy
          const response = await fetch(`/api/lemonsqueezy/verify-payment?checkout_id=${checkoutId}`)

          if (response.ok) {
            setSubscriptionUpdated(true)
            toast({
              title: "Payment Successful!",
              description: "Your subscription has been activated.",
            })
          } else {
            throw new Error('Payment verification failed')
          }
        } else {
          // If no checkout_id, assume success (webhook might not have processed yet)
          setSubscriptionUpdated(true)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed. Please check back in a few minutes.",
          variant: "default",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      handleSuccess()
    } else {
      setIsLoading(false)
    }
  }, [user, searchParams, toast])

  const handleContinue = () => {
    router.push('/search')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-green-700">
            Welcome to your upgraded plan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {subscriptionUpdated ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Pro Features</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600">
                  <Crown className="h-5 w-5" />
                  <span className="font-medium">Enterprise Ready</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">What's included:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Unlimited searches</li>
                  <li>• Export results</li>
                  <li>• Priority support</li>
                  <li>• Advanced features</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                Your subscription is being activated. This may take a few moments.
              </p>
            </div>
          )}

          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
          >
            Start Exploring
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need help? <a href="mailto:support@example.com" className="text-blue-600 hover:underline">Contact support</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}