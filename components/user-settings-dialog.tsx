"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  User as UserIcon, 
  Shield, 
  CreditCard, 
  Mail, 
  Calendar,
  Loader2,
  CheckCircle2,
  Lock,
  AlertCircle,
  Upload,
  Camera,
  Check,
  Crown,
  Zap,
  Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { PlanFeatures, PlanType } from "@/types/subscription"

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: TabType
}

type TabType = "personal" | "security" | "billing"

export function UserSettingsDialog({ open, onOpenChange, initialTab = "personal" }: UserSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  
  // Personal Info State
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  
  // Billing State
  const [searchesLeft, setSearchesLeft] = useState(3)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [isBillingLoading, setIsBillingLoading] = useState(false)
  const { toast } = useToast()

  // Billing constants
  const planIcons = {
    free: Star,
    pro: Zap,
    enterprise: Crown,
    trial: Star,
  }

  const planColors = {
    free: "text-gray-600",
    pro: "text-blue-600",
    enterprise: "text-purple-600",
    trial: "text-orange-600",
  }

  // Default plans
  const defaultPlans: PlanFeatures[] = [
    {
      id: 'free',
      plan_type: 'free',
      plan_name: 'Free',
      plan_description: 'Perfect for getting started',
      search_limit: 10,
      reset_period: 'monthly',
      can_export_results: false,
      can_save_history: true,
      can_share_searches: false,
      has_api_access: false,
      has_priority_support: false,
      max_history_items: 50,
      price_monthly_usd: 0,
      price_yearly_usd: 0,
      display_order: 1,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'pro',
      plan_type: 'pro',
      plan_name: 'Pro',
      plan_description: 'For power users and small teams',
      search_limit: 500,
      reset_period: 'monthly',
      can_export_results: true,
      can_save_history: true,
      can_share_searches: true,
      has_api_access: true,
      has_priority_support: true,
      max_history_items: 1000,
      price_monthly_usd: 19,
      price_yearly_usd: 190,
      display_order: 2,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'enterprise',
      plan_type: 'enterprise',
      plan_name: 'Enterprise',
      plan_description: 'For large organizations',
      search_limit: 5000,
      reset_period: 'monthly',
      can_export_results: true,
      can_save_history: true,
      can_share_searches: true,
      has_api_access: true,
      has_priority_support: true,
      max_history_items: -1, // unlimited
      price_monthly_usd: 99,
      price_yearly_usd: 990,
      display_order: 3,
      is_visible: true,
      created_at: '',
      updated_at: '',
    },
  ]

  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadUserData()
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setEmail(user.email || "")
      setFullName(user.user_metadata?.full_name || "")
      setProfilePhoto(user.user_metadata?.avatar_url || null)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please upload a valid image file (JPG, PNG, GIF, or WEBP)" })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 2MB" })
      return
    }

    setUploadingPhoto(true)
    setMessage(null)

    try {
      if (!user) throw new Error("No user found")

      // Delete old avatar if exists
      const oldAvatarUrl = user.user_metadata?.avatar_url
      if (oldAvatarUrl) {
        try {
          // Extract the file path from the URL
          const urlParts = oldAvatarUrl.split('/storage/v1/object/public/user-uploads/')
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1]
            await supabase.storage
              .from('user-uploads')
              .remove([oldFilePath])
          }
        } catch (error) {
          console.warn('Failed to delete old avatar:', error)
          // Continue with upload even if deletion fails
        }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      // Update user metadata with the storage URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      })

      if (updateError) throw updateError

      setProfilePhoto(publicUrl)
      setMessage({ type: "success", text: "Profile photo updated successfully!" })
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl: publicUrl } }))
      
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Upload error:', error)
      
      // Provide helpful error messages
      let errorMessage = "Failed to upload photo"
      
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        errorMessage = "Storage permission error. Please check Supabase bucket policies. See FIX_RLS_ERROR.md for help."
      } else if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = "File already exists. Please try again."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setMessage({ type: "error", text: errorMessage })
      setProfilePhoto(user?.user_metadata?.avatar_url || null)
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user || !profilePhoto) return

    setUploadingPhoto(true)
    setMessage(null)

    try {
      // Extract the file path from the URL
      const urlParts = profilePhoto.split('/storage/v1/object/public/user-uploads/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('user-uploads')
          .remove([filePath])

        if (deleteError) {
          console.warn('Failed to delete from storage:', deleteError)
        }
      }

      // Update user metadata to remove avatar_url
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        },
      })

      if (updateError) throw updateError

      setProfilePhoto(null)
      setMessage({ type: "success", text: "Profile photo removed successfully!" })
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl: null } }))
      
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Remove photo error:', error)
      setMessage({ type: "error", text: error.message || "Failed to remove photo" })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleUpdateProfile = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      })

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    setLoading(true)
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" })
      setLoading(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Password updated successfully!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update password" })
    } finally {
      setLoading(false)
    }
  }

  // Billing functions
  const handleUpgrade = async (planType: PlanType) => {
    if (planType === 'free') return

    setIsBillingLoading(true)
    setSelectedPlan(planType)

    try {
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          billingCycle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()

      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBillingLoading(false)
      setSelectedPlan(null)
    }
  }

  const getPrice = (plan: PlanFeatures) => {
    if (plan.plan_type === 'free') return { price: 0, period: '' }
    const price = billingCycle === 'monthly' ? plan.price_monthly_usd : plan.price_yearly_usd
    const period = billingCycle === 'monthly' ? '/month' : '/year'
    return { price, period }
  }

  const getSavings = (plan: PlanFeatures) => {
    if (plan.plan_type === 'free' || billingCycle === 'monthly') return null
    const monthlyTotal = plan.price_monthly_usd * 12
    const yearlyPrice = plan.price_yearly_usd
    const savings = monthlyTotal - yearlyPrice
    const percentage = Math.round((savings / monthlyTotal) * 100)
    return { amount: savings, percentage }
  }

  const tabs = [
    { id: "personal" as TabType, label: "Personal Info", icon: UserIcon },
    { id: "security" as TabType, label: "Security", icon: Shield },
    { id: "billing" as TabType, label: "Billing", icon: CreditCard },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] w-[95vw] sm:w-[90vw] h-[95vh] sm:h-[90vh] max-h-[900px] p-0 gap-0">
        <div className="flex flex-col sm:flex-row h-full overflow-hidden">
          {/* Sidebar - Hidden on mobile, replaced by tabs */}
          <div className="hidden sm:flex w-72 border-r bg-muted/30 p-6 flex-col overflow-y-auto">
            <DialogHeader className="mb-6 space-y-1">
              <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Manage your account preferences
              </p>
            </DialogHeader>
            
            <nav className="space-y-2 flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            <div className="mt-auto pt-6 border-t">
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Header and Tabs */}
          <div className="sm:hidden flex flex-col border-b bg-background">
            <DialogHeader className="p-4 pb-2 space-y-1">
              <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Manage your account preferences
              </p>
            </DialogHeader>
            
            <nav className="flex overflow-x-auto px-2 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div 
            className="flex-1 overflow-y-scroll bg-background"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
            }}
          >
            <div className="p-4 sm:p-10 max-w-4xl mx-auto">
              {/* Personal Info Tab */}
              {activeTab === "personal" && (
                <div className="space-y-6 sm:space-y-8 pb-8">
                  <div className="space-y-1 sm:space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">
                      Update your personal details and account information
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-6 max-w-2xl">
                    {/* Profile Photo Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Profile Photo
                      </Label>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                        <div className="relative flex-shrink-0">
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                            {profilePhoto ? (
                              <img 
                                src={profilePhoto} 
                                alt="Profile" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                            )}
                          </div>
                          {uploadingPhoto && (
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingPhoto}
                              className="gap-2 w-full sm:w-auto"
                            >
                              <Upload className="h-4 w-4" />
                              Upload Photo
                            </Button>
                            {profilePhoto && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemovePhoto}
                                disabled={uploadingPhoto}
                                className="w-full sm:w-auto"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF. Max size 2MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        This is the name that will be displayed on your profile
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted/50 cursor-not-allowed h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email address cannot be changed. Contact support if you need assistance.
                      </p>
                    </div>

                    {message && (
                      <div className={cn(
                        "flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-medium",
                        message.type === "success" 
                          ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                          : "bg-destructive/10 border border-destructive/20 text-destructive"
                      )}>
                        {message.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="flex-1">{message.text}</span>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button 
                        onClick={handleUpdateProfile} 
                        disabled={loading}
                        className="w-full h-10 sm:h-11 font-medium text-sm sm:text-base"
                        size="lg"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6 sm:space-y-8 pb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Security Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your password and security preferences
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-6 sm:space-y-8 max-w-2xl">
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-200">
                            Keep your account secure
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold">Change Password</h3>
                      
                      <div className="space-y-3">
                        <Label htmlFor="newPassword" className="text-sm font-semibold">
                          New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 h-10 sm:h-11"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="confirmNewPassword" className="text-sm font-semibold">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmNewPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="pl-10 h-10 sm:h-11"
                          />
                        </div>
                      </div>

                      {message && (
                        <div className={cn(
                          "flex items-start gap-2 p-3 rounded-lg text-xs sm:text-sm",
                          message.type === "success" 
                            ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                            : "bg-destructive/10 border border-destructive/20 text-destructive"
                        )}>
                          {message.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="flex-1">{message.text}</span>
                        </div>
                      )}

                      <Button 
                        onClick={handleUpdatePassword} 
                        disabled={loading || !newPassword || !confirmNewPassword}
                        className="w-full h-10 sm:h-11 text-sm sm:text-base"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-lg sm:text-xl font-semibold">Active Sessions</h3>
                      <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Current Device</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: Just now
                            </p>
                          </div>
                          <div className="px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs rounded-full w-fit">
                            Active
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <div className="space-y-6 sm:space-y-8 pb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Billing & Subscription</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose the perfect plan for your research needs
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-6 sm:space-y-8 max-w-5xl">
                    {/* Billing Cycle Toggle */}
                    <div className="flex justify-center">
                      <div className="bg-muted p-1 rounded-lg">
                        <Button
                          variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setBillingCycle('monthly')}
                          className="px-4"
                        >
                          Monthly
                        </Button>
                        <Button
                          variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setBillingCycle('yearly')}
                          className="px-4"
                        >
                          Yearly
                          <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                            Save up to 17%
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {defaultPlans.map((plan) => {
                        const Icon = planIcons[plan.plan_type]
                        const isPopular = plan.plan_type === 'pro'
                        const { price, period } = getPrice(plan)
                        const savings = getSavings(plan)

                        return (
                          <div
                            key={plan.id}
                            className={`relative p-6 border rounded-lg transition-all duration-200 hover:shadow-lg ${
                              isPopular ? 'border-primary shadow-md' : 'border-border'
                            }`}
                          >
                            {isPopular && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                                  Most Popular
                                </span>
                              </div>
                            )}

                            <div className="text-center mb-6">
                              <div className={`mx-auto mb-3 ${planColors[plan.plan_type]}`}>
                                <Icon size={32} />
                              </div>
                              <h3 className="text-xl font-semibold mb-2">{plan.plan_name}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{plan.plan_description}</p>

                              <div className="mb-2">
                                <span className="text-3xl font-bold">${price}</span>
                                <span className="text-muted-foreground text-sm">{period}</span>
                              </div>
                              {savings && (
                                <p className="text-sm text-green-600 font-medium">
                                  Save ${savings.amount} ({savings.percentage}%)
                                </p>
                              )}
                            </div>

                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-2 text-sm">
                                <Check size={16} className="text-green-500 flex-shrink-0" />
                                <span>
                                  {plan.search_limit === -1 ? 'Unlimited' : plan.search_limit} searches
                                  {plan.reset_period !== 'never' && ` per ${plan.reset_period.slice(0, -2)}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <Check size={16} className="text-green-500 flex-shrink-0" />
                                <span>
                                  {plan.max_history_items === -1 ? 'Unlimited' : plan.max_history_items} history items
                                </span>
                              </div>

                              {plan.can_export_results && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Check size={16} className="text-green-500 flex-shrink-0" />
                                  <span>Export results</span>
                                </div>
                              )}

                              {plan.can_share_searches && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Check size={16} className="text-green-500 flex-shrink-0" />
                                  <span>Share searches</span>
                                </div>
                              )}

                              {plan.has_api_access && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Check size={16} className="text-green-500 flex-shrink-0" />
                                  <span>API access</span>
                                </div>
                              )}

                              {plan.has_priority_support && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Check size={16} className="text-green-500 flex-shrink-0" />
                                  <span>Priority support</span>
                                </div>
                              )}
                            </div>

                            <Button
                              className="w-full"
                              variant={plan.plan_type === 'free' ? "outline" : "default"}
                              disabled={isBillingLoading}
                              onClick={() => handleUpgrade(plan.plan_type)}
                            >
                              {isBillingLoading && selectedPlan === plan.plan_type ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : plan.plan_type === 'free' ? (
                                'Current Plan'
                              ) : (
                                `Upgrade to ${plan.plan_name}`
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-center">Frequently Asked Questions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-1">Can I change plans anytime?</h4>
                          <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time.</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
                          <p className="text-muted-foreground">We accept all major credit cards and PayPal.</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Is there a free trial?</h4>
                          <p className="text-muted-foreground">Start with our free plan and upgrade anytime.</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Do you offer refunds?</h4>
                          <p className="text-muted-foreground">30-day money-back guarantee on all paid plans.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile User Info - Shown at bottom on mobile only */}
              <div className="sm:hidden mt-8 pt-6 border-t">
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
