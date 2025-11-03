"use client"

import { useMining } from "@/lib/hooks/use-mining"
import { CircularMiningCountdown } from "./circular-mining-countdown"
import { Pickaxe, Loader2, Zap } from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"

function HalvingCountdown({ halvingDate }: { halvingDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!halvingDate) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const target = new Date(halvingDate).getTime()
      const distance = target - now

      if (distance < 0) {
        setIsExpired(true)
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [halvingDate])

  if (!halvingDate || isExpired) return null

  return (
    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          <div>
            <div className="text-sm font-semibold text-orange-400">Halving Event</div>
            <div className="text-xs text-gray-400">Rewards reduce to 0.15 AFX</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-orange-400">{timeLeft}</div>
          <div className="text-xs text-gray-400">remaining</div>
        </div>
      </div>
    </div>
  )
}

export function MiningWidget() {
  const { canMine, timeRemaining, isClaiming, isLoading, handleClaim, miningConfig } = useMining()
  const [showSuccess, setShowSuccess] = useState(false)

  const rewardAmount = miningConfig?.reward_amount || 0.5
  const intervalHours = miningConfig?.interval_hours || 5
  const halvingDate = miningConfig?.halving_date
  const isHalved = miningConfig?.is_halved || false

  const onClaim = async () => {
    const result = await handleClaim()
    if (result?.success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-white/5">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 rounded-2xl border border-white/5">
      <div className="flex flex-col items-center space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Pickaxe className="w-6 h-6 text-green-500" />
            <h3 className="text-2xl font-bold text-white">AFX Mining</h3>
          </div>
          <p className="text-sm text-gray-400">
            Claim {rewardAmount} AFX every {intervalHours} hours
          </p>
          {isHalved && (
            <div className="mt-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
              <span className="text-xs font-semibold text-orange-400">Post-Halving Rewards Active</span>
            </div>
          )}
        </div>

        {!isHalved && halvingDate && <HalvingCountdown halvingDate={halvingDate} />}

        {/* Circular Countdown */}
        <div className="py-4">
          <CircularMiningCountdown timeRemaining={timeRemaining} />
        </div>

        {/* Claim Button */}
        <div className="w-full">
          {showSuccess ? (
            <div className="text-center py-4">
              <div className="text-green-500 font-semibold text-lg mb-1">
                ✓ Successfully claimed {rewardAmount} AFX!
              </div>
              <div className="text-sm text-gray-400">Come back in {intervalHours} hours</div>
            </div>
          ) : (
            <Button
              onClick={onClaim}
              disabled={!canMine || isClaiming}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : canMine ? (
                <>
                  <Pickaxe className="w-5 h-5 mr-2" />
                  Claim {rewardAmount} AFX
                </>
              ) : (
                <>
                  <Pickaxe className="w-5 h-5 mr-2" />
                  Mining in Progress
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="w-full pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-400 mb-1">Current Reward</div>
              <div className="text-lg font-bold text-green-400">{rewardAmount} AFX</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Interval</div>
              <div className="text-lg font-bold text-blue-400">{intervalHours} Hours</div>
            </div>
          </div>

          {!isHalved && (
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500">After halving: 0.15 AFX per {intervalHours} hours</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
