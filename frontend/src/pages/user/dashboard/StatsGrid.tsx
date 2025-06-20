// src/components/StatsGrid.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const stats = [
  { title: "Today's Workouts", value: 5 },
  { title: "Active Users", value: 32 },
  { title: "New Messages", value: 8 },
  { title: "Avg. Rating", value: 4.8 },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.title}</CardDescription>
            <CardTitle className="text-2xl">{stat.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}