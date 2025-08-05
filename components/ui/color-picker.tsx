import { Input } from "./input"
import { Label } from "./label"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 p-1"
      />
      <span className="text-sm text-gray-500">{value}</span>
    </div>
  )
} 