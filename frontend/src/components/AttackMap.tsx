"use client"

import { useEffect, useState, useRef } from 'react'
import { Map, Marker, Source, Layer } from 'react-map-gl/mapbox'
import { ShieldAlert } from 'lucide-react'

// Mapbox Token (In production, this comes from ENV)
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2VudGluZWx4LWRlbW8iLCJhIjoiY2x4eHh4eHh4eHh4eHh4eHh4eHh4In0.xxxxxxxxxxxxxx'

interface AttackPoint {
  id: string
  lat: number
  lon: number
  severity: string
  source: string
}

export default function AttackMap({ alerts }: { alerts: any[] }) {
  const [points, setPoints] = useState<AttackPoint[]>([])

  useEffect(() => {
    // Extract lat/lon from alerts with geoip data
    const newPoints = alerts
      .filter(a => a.geoip && a.geoip.lat && a.geoip.lon)
      .map(a => ({
        id: a.id,
        lat: a.geoip.lat,
        lon: a.geoip.lon,
        severity: a.severity,
        source: a.source
      }))
    
    setPoints(newPoints)
  }, [alerts])

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#1E293B]">
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {points.map(point => (
          <Marker 
            key={point.id} 
            latitude={point.lat} 
            longitude={point.lon} 
            anchor="bottom"
          >
            <div className="relative group">
              <div className={`w-3 h-3 rounded-full animate-ping absolute inset-0 ${
                point.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
              }`} />
              <div className={`w-3 h-3 rounded-full relative ${
                point.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
              } shadow-[0_0_10px_rgba(239,68,68,0.5)]`} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#0A0B0E] border border-[#1E293B] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{point.source}</div>
                <div className="text-[10px] font-bold text-white uppercase">{point.severity} Alert</div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-[#0A0B0E]/80 backdrop-blur rounded-xl border border-[#1E293B] z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Critical Threat</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">High Severity</span>
        </div>
      </div>
    </div>
  )
}
