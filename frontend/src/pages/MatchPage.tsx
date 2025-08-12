
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";



export default function MatchPage() {

  const inputStyle =
    "h-10 px-3 py-2 border border-input rounded-md text-foreground bg-white hover:border-hover hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200";

  

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      

      {/* ✅ 页面内容 */}
      <main className="px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Input
            placeholder="Location"
            className="col-span-2 w-full h-10 px-3 py-2 border border-gray-900 rounded-md text-gray-900"
          />

          <Select >
            <SelectTrigger className={inputStyle}>
              <SelectValue placeholder="Select Sport" />
            </SelectTrigger>
            <SelectContent>
              
            </SelectContent>
          </Select>

          <Select>
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
             
              
            }}
          >
            搜索
          </Button>
        </div>

        
      </main>
    </div>
  );
}
