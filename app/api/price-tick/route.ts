import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_BASE_PRICE = 16.0
const VOLATILITY = 0.1 // ±10% for realistic swings
const MIN_DAILY_GROWTH = 0.026 // 2.6%
const MAX_DAILY_GROWTH = 0.041 // 4.1%
const DAILY_RESET_HOUR = 15 // 3 PM

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: latestTick } = await supabase
      .from("coin_ticks")
      .select("*")
      .order("tick_timestamp", { ascending: false })
      .limit(1)
      .single()

    const now = new Date()
    const currentDate = now.toISOString().split("T")[0]
    const currentHour = now.getHours()

    let currentPrice = DEFAULT_BASE_PRICE
    let openingPrice = DEFAULT_BASE_PRICE
    let targetGrowth = MIN_DAILY_GROWTH + Math.random() * (MAX_DAILY_GROWTH - MIN_DAILY_GROWTH)

    if (latestTick) {
      const latestDate = new Date(latestTick.tick_timestamp).toISOString().split("T")[0]
      const latestHour = new Date(latestTick.tick_timestamp).getHours()

      if (latestDate !== currentDate && currentHour >= DAILY_RESET_HOUR) {
        // New day after 3 PM - reset with new target
        openingPrice = Number(latestTick.price)
        currentPrice = openingPrice
        targetGrowth = MIN_DAILY_GROWTH + Math.random() * (MAX_DAILY_GROWTH - MIN_DAILY_GROWTH)
      } else {
        // Same day - continue from last price
        currentPrice = Number(latestTick.price)

        // Get opening price for the day
        const { data: dayOpening } = await supabase
          .from("coin_ticks")
          .select("price")
          .eq("reference_date", currentDate)
          .order("tick_timestamp", { ascending: true })
          .limit(1)
          .single()

        openingPrice = dayOpening ? Number(dayOpening.price) : currentPrice
      }
    }

    let minutesSinceReset: number
    if (currentHour >= DAILY_RESET_HOUR) {
      minutesSinceReset = (currentHour - DAILY_RESET_HOUR) * 60 + now.getMinutes()
    } else {
      minutesSinceReset = (24 - DAILY_RESET_HOUR + currentHour) * 60 + now.getMinutes()
    }

    const totalMinutesInDay = 24 * 60
    const progressRatio = minutesSinceReset / totalMinutesInDay

    const targetPrice = openingPrice * (1 + targetGrowth)
    const expectedPrice = openingPrice + (targetPrice - openingPrice) * progressRatio
    const drift = (expectedPrice - currentPrice) * 0.05 // 5% of the gap per tick

    const randomHigh = currentPrice * (1 + VOLATILITY * Math.random())
    const randomLow = currentPrice * (1 - VOLATILITY * Math.random())
    const average = (randomHigh + randomLow) / 2 + drift
    const newPrice = Math.max(0.01, Number(average.toFixed(2))) // 2 decimal places

    const { error: insertError } = await supabase.from("coin_ticks").insert({
      price: newPrice,
      high: Number(randomHigh.toFixed(2)),
      low: Number(randomLow.toFixed(2)),
      average: Number(average.toFixed(2)),
      reference_date: currentDate,
      tick_timestamp: now.toISOString(),
    })

    if (insertError) {
      console.error("[v0] Error inserting price tick:", insertError)
      return NextResponse.json({ error: "Failed to store price" }, { status: 500 })
    }

    return NextResponse.json({
      price: newPrice,
      high: Number(randomHigh.toFixed(2)),
      low: Number(randomLow.toFixed(2)),
      average: Number(average.toFixed(2)),
      changePercent: ((newPrice - openingPrice) / openingPrice) * 100,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Price tick error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
