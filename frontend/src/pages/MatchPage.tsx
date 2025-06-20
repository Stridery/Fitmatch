import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Dumbbell, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Coach {
  id: number;
  name: string;
  rating: number;
  price: string;
  location: string;
  image: string;
  tag: string;
}

interface Category {
  name: string;
  coaches: Coach[];
}

export default function MatchPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [location, setLocation] = useState("");
  const [sport, setSport] = useState("");
  const [gender, setGender] = useState("any");

  const inputStyle =
    "h-10 px-3 py-2 border border-input rounded-md text-foreground bg-white hover:border-hover hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200";

  useEffect(() => {
    fetch("/api/sports")
      .then((res) => res.json())
      .then((data) => setSports(data))
      

      .catch((err) => console.error("加载运动项目失败", err));
  }, []);

  useEffect(() => {
    fetch("/api/coach/popular")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))

      .catch((err) => console.error("加载热门教练失败", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      

      {/* ✅ 页面内容 */}
      <main className="px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Input
            placeholder="Location"
            className="col-span-2 w-full h-10 px-3 py-2 border border-gray-900 rounded-md text-gray-900"
            onChange={(e) => setLocation(e.target.value)}
          />

          <Select onValueChange={setSport}>
            <SelectTrigger className={inputStyle}>
              <SelectValue placeholder="Select Sport" />
            </SelectTrigger>
            <SelectContent>
              {sports.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setGender}>
            <SelectTrigger className={inputStyle}>
              <SelectValue placeholder="Coach Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="w-full"
            onClick={() => {
              const params = new URLSearchParams();
              if (location) params.set("location", location);
              if (sport) params.set("sport", sport);
              if (gender && gender !== "any") params.set("gender", gender);
              navigate(`/search?${params.toString()}`);
            }}
          >
            搜索
          </Button>
        </div>

        {categories.map((category) => (
          <div key={category.name} className="mb-10">
            <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {category.coaches.map((coach) => (
                <Card key={coach.id} className="hover:shadow-lg transition">
                  <img
                    src={coach.image}
                    alt={coach.name}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <CardContent className="p-4 space-y-2">
                    <div className="text-lg font-semibold">{coach.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {coach.location}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" /> {coach.tag}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" /> 评分: {coach.rating}
                    </div>
                    <div className="text-right font-bold text-primary">
                      {coach.price}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
