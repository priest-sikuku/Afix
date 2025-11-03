"use client"

import { Users, Wallet, ArrowLeftRight } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AFXPriceWidget } from "./afx-price-widget"
import { Button } from "@/components/ui/button"
import { BalanceTransferModal } from "./balance-transfer-modal"

export function DashboardStats() {
  const [dashboardBalance, setDashboardBalance] = useState(0)
  const [p2pBalance, setP2pBalance] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [referralEarnings, setReferralEarnings] = useState(0)
  const [showTransferModal, setShowTransferModal] = useState(false)

  const fetchStats = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: coins } = await supabase
        .from("coins")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "available")

      if (coins) {
        const totalBalance = coins.reduce((sum, coin) => sum + Number(coin.amount), 0)
        setDashboardBalance(totalBalance)
      }

      const { data: tradeCoins } = await supabase
        .from("trade_coins")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "available")

      if (tradeCoins) {
        const totalP2PBalance = tradeCoins.reduce((sum, coin) => sum + Number(coin.amount), 0)
        setP2pBalance(totalP2PBalance)
      }

      const { data: commissions } = await supabase
        .from("referral_commissions")
        .select("amount")
        .eq("referrer_id", user.id)
        .eq("status", "completed")

      if (commissions) {
        const totalEarnings = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
        setReferralEarnings(totalEarnings)
      }

      const { data: referrals } = await supabase
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("referrer_id", user.id)

      if (referrals) {
        setTotalReferrals(referrals.length)
      }
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <AFXPriceWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dashboard Balance Card */}
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Dashboard Balance</p>
              <p className="text-3xl font-bold text-white">{dashboardBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Mining & Referral Rewards</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="text-xs text-blue-400">AFX Coins</div>
        </div>

        {/* P2P Balance Card */}
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">P2P Balance</p>
              <p className="text-3xl font-bold text-white">{p2pBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Available for Trading</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="text-xs text-green-400">AFX Coins</div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => setShowTransferModal(true)}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Transfer Between Balances
        </Button>
      </div>

      {/* Referral Earnings Card */}
      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Referral Earnings</p>
            <p className="text-3xl font-bold text-yellow-400">{referralEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{totalReferrals} Active Downlines</p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Users className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <div className="text-xs text-yellow-400">1.5% P2P trading + 1% mining</div>
      </div>

      <BalanceTransferModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        dashboardBalance={dashboardBalance}
        p2pBalance={p2pBalance}
        onTransferComplete={fetchStats}
      />
    </div>
  )
}
