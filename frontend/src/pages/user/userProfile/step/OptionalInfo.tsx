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
      <h2 className="text-xl font-semibold">Optional Information (Optional)</h2>

      {/* Height */}
      <div className="space-y-2">
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          placeholder="Like 170"
          value={profile.height}
          onChange={(e) => setProfile({ ...profile, height: e.target.value })}
        />
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          placeholder="Like 60"
          value={profile.weight}
          onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
        />
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label htmlFor="frequency">Current training frequency</Label>
        <Select
          value={profile.frequency}
          onValueChange={(value) => setProfile({ ...profile, frequency: value })}
        >
          <SelectTrigger className="w-full text-black bg-white dark:text-white dark:bg-gray-900">
            <SelectValue placeholder="Choose your current training frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rarely">Almost 0</SelectItem>
            <SelectItem value="1-2/week">1-2 times a week</SelectItem>
            <SelectItem value="3-5/week">3-5 times a week</SelectItem>
            <SelectItem value="daily">Almost everyday</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default OptionalInfo