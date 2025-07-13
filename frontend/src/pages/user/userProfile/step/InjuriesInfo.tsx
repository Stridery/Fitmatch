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
      <h2 className="text-xl font-semibold">Injuries (Optional)</h2>

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
                className="border p-3 rounded bg-gray-50 flex flex-col gap-1"
              >
                <div className="flex gap-1 justify-end">
                  <Button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="text-sm text-black bg-gray-200 hover:bg-gray-300"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="text-sm text-black bg-gray-200 hover:bg-gray-300"
                  >
                    🗑️ Delete
                  </Button>
                </div>

                <p className="mt-0"><strong>Type:</strong> {label}</p>
                {injury.injuryTag.length > 0 && (
                  <p className="mt-0"><strong>Tags:</strong> {injury.injuryTag.join(", ")}</p>
                )}
                <p className="mt-0"><strong>Visible to Coach:</strong> {injury.isVisibleToCoach ? "Yes" : "No"}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-500">None</p>
      )}

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          type="button"
          variant="outline"
          className="text-black"
        >
          Add Injury Record
        </Button>
      )}

      {showForm && (
        <div className="space-y-4 border rounded-lg p-4 bg-white shadow-sm">
          <div className="space-y-2">
            <Label>Injury Type</Label>
            <Select
              value={newInjury.injuryType}
              onValueChange={(val) => setNewInjury({ ...newInjury, injuryType: val })}
            >
              <SelectTrigger className="border text-black">
                <SelectValue placeholder="Select injury type" />
              </SelectTrigger>
              <SelectContent>
                {injuryTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newInjury.injuryType === "other" && (
            <div className="space-y-2">
              <Label>Custom Injury Type</Label>
              <Input
                value={newInjury.customInjuryType}
                onChange={(e) =>
                  setNewInjury({ ...newInjury, customInjuryType: e.target.value })
                }
                placeholder="e.g. Hip inflammation"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags (optional, multiple)</Label>
            <div className="flex flex-wrap gap-3">
              {injuryTagOptions.map((tag) => (
                <div key={tag.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag.value}
                    checked={newInjury.injuryTag.includes(tag.value)}
                    onCheckedChange={() => toggleTag(tag.value)}
                  />
                  <Label htmlFor={tag.value}>{tag.label}</Label>
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
            <Label htmlFor="visible">Visible to Coach</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveInjury}
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