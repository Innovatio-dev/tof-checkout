"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import SnappFlag from "@/components/custom/snapp-flag"

interface GeoData {
  ip: string
  countryCode: string
  countryName: string
}

const DEFAULT_GEO: GeoData = {
  ip: "",
  countryCode: "",
  countryName: "",
}

const IpDetectorBlock = () => {
  const [geo, setGeo] = useState<GeoData>(DEFAULT_GEO)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/")
        if (!response.ok) {
          throw new Error("Failed to fetch geo data")
        }
        const data = await response.json()
        setGeo({
          ip: data.ip ?? "",
          countryCode: data.country_code ?? "",
          countryName: data.country_name ?? "",
        })
      } catch (error) {
        setGeo(DEFAULT_GEO)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGeo()
  }, [])

  const locationLabel = useMemo(() => {
    if (!geo.countryName && !geo.countryCode) {
      return "Location unavailable"
    }
    if (geo.countryName && geo.countryCode) {
      return `${geo.countryName}, ${geo.countryCode}`
    }
    return geo.countryName || geo.countryCode
  }, [geo.countryName, geo.countryCode])

  return (
    <div className="flex justify-between bg-white/8 border border-white/10 rounded-2xl p-6 select-none">
      <div className="flex items-center gap-3">
        {geo.countryCode ? (
          <SnappFlag code={geo.countryCode} className="h-auto w-7" />
        ) : (
          <span className="h-5 w-7 rounded-[4px] border border-white/10" />
        )}
        <div className="font-semibold">
          {isLoading ? "Detecting location..." : locationLabel}
        </div>
        <div className="flex text-muted-foreground font-semibold font-mono px-4">
          {isLoading ? "IP: ..." : `IP: ${geo.ip || "Unavailable"}`}
        </div>
      </div>
      <Link href="/support">Contact - <span className="text-neon-green">Support</span></Link>
    </div>
  )
}

export default IpDetectorBlock
