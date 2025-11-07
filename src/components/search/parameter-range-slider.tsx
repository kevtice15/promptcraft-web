'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface ParameterRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  label: string
  step?: number
}

export function ParameterRangeSlider({
  min,
  max,
  value,
  onChange,
  label,
  step = 1
}: ParameterRangeSliderProps) {
  const [minValue, setMinValue] = useState(value[0])
  const [maxValue, setMaxValue] = useState(value[1])

  useEffect(() => {
    setMinValue(value[0])
    setMaxValue(value[1])
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxValue)
    setMinValue(val)
    onChange([val, maxValue])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minValue)
    setMaxValue(val)
    onChange([minValue, val])
  }

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(min, Math.min(Number(e.target.value) || min, maxValue))
    setMinValue(val)
    onChange([val, maxValue])
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(max, Math.max(Number(e.target.value) || max, minValue))
    setMaxValue(val)
    onChange([minValue, val])
  }

  const minPercent = ((minValue - min) / (max - min)) * 100
  const maxPercent = ((maxValue - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Range slider */}
      <div className="relative">
        <div className="relative h-2 bg-gray-200 rounded">
          {/* Active range */}
          <div 
            className="absolute h-2 bg-blue-500 rounded"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
          
          {/* Min slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={handleMinChange}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          />
          
          {/* Max slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxChange}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      {/* Value inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Min
          </label>
          <Input
            type="number"
            min={min}
            max={maxValue}
            step={step}
            value={minValue}
            onChange={handleMinInputChange}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Max
          </label>
          <Input
            type="number"
            min={minValue}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxInputChange}
            className="text-sm"
          />
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}