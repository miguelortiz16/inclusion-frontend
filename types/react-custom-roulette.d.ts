declare module 'react-custom-roulette' {
  export interface WheelOption {
    option: string
    style: { backgroundColor: string; textColor: string }
  }

  export interface Props {
    mustStartSpinning: boolean
    prizeNumber: number
    data: WheelOption[]
    onStopSpinning: () => void
    backgroundColors: string[]
    textColors: string[]
    outerBorderColor: string
    outerBorderWidth: number
    innerRadius: number
    innerBorderColor: string
    innerBorderWidth: number
    radiusLineColor: string
    radiusLineWidth: number
    spinDuration: number
    perpendicularText: boolean
    textDistance: number
    fontSize: number
    diameter: number
  }

  export const Wheel: React.FC<Props>
} 