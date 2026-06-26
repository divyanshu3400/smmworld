import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Gift,
  Users,
  DollarSign,
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getReferralStats, getReferredUsers } from '@/services/referral.service'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function ReferralPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => getReferralStats(user!.id),
    enabled: !!user?.id,
  })

  const { data: referredUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['referred-users'],
    queryFn: () => getReferredUsers(user!.id, 1, 10),
    enabled: !!user?.id,
  })

  const referralLink = stats?.referralCode
    ? `${window.location.origin}/signup?ref=${stats.referralCode}`
    : ''

  const handleCopyCode = async () => {
    if (!stats?.referralCode) return
    await navigator.clipboard.writeText(stats.referralCode)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const handleShare = (platform: string) => {
    const text = `Join SMMHub using my referral link and get started!`
    const url = referralLink

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent('Join SMMHub')}&body=${encodeURIComponent(text + '\n\n' + url)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  const statCards = [
    {
      title: 'Referral Code',
      value: stats?.referralCode || '-',
      icon: Gift,
      color: 'emerald',
    },
    {
      title: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Commission Earned',
      value: formatCurrency(stats?.commissionEarned || 0),
      icon: DollarSign,
      color: 'purple',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
        <p className="text-muted-foreground">Invite friends and earn rewards</p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold">Share & Earn</h2>
                <p className="text-muted-foreground mt-1">
                  Invite friends to SMMHub and earn bonuses for every successful referral
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-12 w-12 text-emerald-500" />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={stats?.referralCode || ''}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button onClick={handleCopyCode} className="bg-emerald-500 hover:bg-emerald-600">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Your Referral Link</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-sm"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <span className="text-sm text-muted-foreground">Share via:</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('twitter')}
                className="h-8 w-8"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                className="h-8 w-8"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('linkedin')}
                className="h-8 w-8"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('email')}
                className="h-8 w-8"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  )}
                </div>
                <div
                  className={`h-10 w-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}
                >
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>People who signed up using your referral code</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : referredUsers?.data && referredUsers.data.length > 0 ? (
              <div className="space-y-3">
                {referredUsers.data.map((u) => {
                  const firstName = u.first_name ?? ''
                  const lastName = u.last_name ?? ''
                  return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {firstName || lastName
                            ? `${firstName} ${lastName}`.trim()
                            : 'Anonymous User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined {formatDate(u.created_at, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500">
                      Active
                    </Badge>
                  </div>
                )})}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No referrals yet</h3>
                <p className="text-muted-foreground">
                  Share your referral link to start earning
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
