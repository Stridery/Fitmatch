import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { Injury } from "@/entities/user"

export const injuryTypeOptions = [
  { value: "shoulder", label: "Shoulder Strain" },
  { value: "waist", label: "Lumbar Sprain" },
  { value: "knee", label: "Knee Injury" },
  { value: "ankle", label: "Ankle Sprain" },
  { value: "other", label: "Other" },
]

export const injuryTagOptions = [
  { value: "chronic", label: "Chronic" },
  { value: "old", label: "Old Injury" },
  { value: "sudden", label: "Sudden Onset" },
  { value: "severe", label: "Severe" },
  { value: "recovering", label: "Recovering" },
]

type Props = {
  injuries: Injury[]
  setInjuries: (injuries: Injury[]) => void
}

const InjuriesInfo: React.FC<Props> = ({ injuries, setInjuries }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [newInjury, setNewInjury] = useState<Injury>({
    injuryType: "",
    customInjuryType: "",
    injuryTag: [],
    isVisibleToCoach: true,
  })

  const handleEdit = (index: number) => {
    setNewInjury(injuries[index])
    setEditingIndex(index)
    setShowForm(true)
  }

  const resetForm = () => {
    setNewInjury({
      injuryType: "",
      customInjuryType: "",
      injuryTag: [],
      isVisibleToCoach: true,
    })
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleSaveInjury = () => {
    if (!newInjury.injuryType) return

    if (editingIndex !== null) {
      const updated = [...injuries]
      updated[editingIndex] = newInjury
      setInjuries(updated)
    } else {
      setInjuries([...injuries, newInjury])
    }

    resetForm()
  }

  const toggleTag = (tag: string) => {
    const updatedTags = newInjury.injuryTag.includes(tag)
      ? newInjury.injuryTag.filter((t) => t !== tag)
      : [...newInjury.injuryTag, tag]
    setNewInjury({ ...newInjury, injuryTag: updatedTags })
  }

  const handleDelete = (indexToRemove: number) => {
    const updated = injuries.filter((_, index) => index !== indexToRemove)
    setInjuries(updated)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Injuries (Optional)</h2>

      {injuries.length > 0 ? (
        <div className="space-y-2">
          {injuries.map((injury, index) => {
            const label =
              injury.injuryType === "other"
                ? injury.customInjuryType
                : injuryTypeOptions.find((opt) => opt.value === injury.injuryType)?.label || injury.injuryType

            return (
              <div
                key={index}
                className="border border-gray-600 p-3 rounded bg-gray-700 flex flex-col gap-1"
              >
                <div className="flex gap-1 justify-end">
                  <Button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="text-sm text-white bg-gray-600 hover:bg-gray-500"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="text-sm text-white bg-gray-600 hover:bg-gray-500"
                  >
                    🗑️ Delete
                  </Button>
                </div>

                <p className="mt-0 text-white"><strong>Type:</strong> {label}</p>
                {injury.injuryTag.length > 0 && (
                  <p className="mt-0 text-white"><strong>Tags:</strong> {injury.injuryTag.join(", ")}</p>
                )}
                <p className="mt-0 text-white"><strong>Visible to Coach:</strong> {injury.isVisibleToCoach ? "Yes" : "No"}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-400">None</p>
      )}

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          type="button"
          variant="outline"
          className="text-white bg-gray-700 border-gray-600 hover:bg-gray-600"
        >
          Add Injury Record
        </Button>
      )}

      {showForm && (
        <div className="space-y-4 border border-gray-600 rounded-lg p-4 bg-gray-700 shadow-sm">
          <div className="space-y-2">
            <Label className="text-gray-300">Injury Type</Label>
            <Select
              value={newInjury.injuryType}
              onValueChange={(val) => setNewInjury({ ...newInjury, injuryType: val })}
            >
              <SelectTrigger className="border border-gray-600 text-white bg-gray-700">
                <SelectValue placeholder="Select injury type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {injuryTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-gray-700">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newInjury.injuryType === "other" && (
            <div className="space-y-2">
              <Label className="text-gray-300">Custom Injury Type</Label>
              <Input
                value={newInjury.customInjuryType}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, customInjuryType: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Tags (optional, multiple)</Label>
            <div className="flex flex-wrap gap-3">
              {injuryTagOptions.map((tag) => (
                <div key={tag.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag.value}
                    checked={newInjury.injuryTag.includes(tag.value)}
                    onCheckedChange={() => toggleTag(tag.value)}
                  />
                  <Label htmlFor={tag.value} className="text-gray-300">{tag.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="visible"
              checked={newInjury.isVisibleToCoach}
              onCheckedChange={(checked) =>
                setNewInjury({ ...newInjury, isVisibleToCoach: !!checked })
              }
            />
            <Label htmlFor="visible" className="text-gray-300">Visible to Coach</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              className="bg-gray-600 text-white hover:bg-gray-500"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-white hover:bg-gray-100 text-black"
            >
              {editingIndex !== null ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InjuriesInfo