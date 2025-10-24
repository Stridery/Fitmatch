import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  profile: {
    height: string
    weight: string
    frequency: string
    [key: string]: any
  }
  setProfile: (val: any) => void
}

const OptionalInfo: React.FC<Props> = ({ profile, setProfile }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Optional Information (Optional)</h2>

      {/* Height */}
      <div className="space-y-2">
        <Label htmlFor="height" className="text-gray-300">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          placeholder="Like 170"
          value={profile.height}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
        />
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight" className="text-gray-300">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          placeholder="Like 60"
          value={profile.weight}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
        />
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label htmlFor="frequency" className="text-gray-300">Current training frequency</Label>
        <Select
          value={profile.frequency}
          onValueChange={(value) => setProfile({ ...profile, frequency: value })}
        >
          <SelectTrigger className="w-full text-white bg-gray-700 border-gray-600">
            <SelectValue placeholder="Choose your current training frequency" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="rarely" className="text-white hover:bg-gray-700">Almost 0</SelectItem>
            <SelectItem value="1-2/week" className="text-white hover:bg-gray-700">1-2 times a week</SelectItem>
            <SelectItem value="3-5/week" className="text-white hover:bg-gray-700">3-5 times a week</SelectItem>
            <SelectItem value="daily" className="text-white hover:bg-gray-700">Almost everyday</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default OptionalInfo