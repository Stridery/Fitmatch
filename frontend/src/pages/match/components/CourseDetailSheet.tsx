import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CourseSearchItem } from "../types";

interface CourseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseSearchItem | null;
}

export function CourseDetailSheet({ open, onOpenChange, course }: CourseDetailSheetProps) {
  if (!course) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {/* 顶部摘要 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold">{course.course_title || "未命名课程"}</h3>
          <div className="text-sm text-gray-500 mt-2">
            <span>{course.sport_name || "—"}</span>
            <span className="mx-2">·</span>
            <span>{course.city || "—"}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="course" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="course" className="flex-1">课程</TabsTrigger>
            <TabsTrigger value="coach" className="flex-1">教练</TabsTrigger>
          </TabsList>

          <TabsContent value="course" className="mt-4">
            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <h4 className="font-medium mb-2">基本信息</h4>
                <div className="space-y-2 text-gray-600">
                  <p>课程ID：{course.course_id}</p>
                  <p>课程名称：{course.course_title}</p>
                  <p>运动类型：{course.sport_name}</p>
                  <p>教练姓名：{course.coach_name}</p>
                  <p>教练昵称：{course.coach_nickname}</p>
                  <p>城市：{course.city}</p>
                  <p>匹配度：{Math.round(course.match_score)}%</p>
                </div>
              </div>

              {/* 价格信息 */}
              <div>
                <h4 className="font-medium mb-2">价格信息</h4>
                <div className="space-y-2 text-gray-600">
                  <p>每节价格：{course.price_per_session ? `¥${course.price_per_session}` : '暂无'}</p>
                  <p>每小时价格：{course.price_per_hour ? `¥${course.price_per_hour}` : '暂无'}</p>
                </div>
              </div>

              {/* 证书信息 */}
              <div>
                <h4 className="font-medium mb-2">证书信息</h4>
                <div className="flex flex-wrap gap-2">
                  {course.certificates?.length > 0 ? course.certificates.map(cert => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  )) : <p className="text-gray-600">暂无证书</p>}
                </div>
              </div>

              {/* 课程风格 */}
              <div>
                <h4 className="font-medium mb-2">课程风格</h4>
                <div className="flex flex-wrap gap-2">
                  {course.styles?.length > 0 ? course.styles.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">暂无风格信息</p>}
                </div>
              </div>

              {/* 沟通风格 */}
              <div>
                <h4 className="font-medium mb-2">沟通风格</h4>
                <div className="flex flex-wrap gap-2">
                  {course.comm_styles?.length > 0 ? course.comm_styles.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">暂无沟通风格信息</p>}
                </div>
              </div>

              {/* 训练强度 */}
              <div>
                <h4 className="font-medium mb-2">训练强度</h4>
                <div className="flex flex-wrap gap-2">
                  {course.pace_intensities?.length > 0 ? course.pace_intensities.map(intensity => (
                    <Badge key={intensity} variant="secondary">{intensity}</Badge>
                  )) : <p className="text-gray-600">暂无强度信息</p>}
                </div>
              </div>

              {/* 适合学员 */}
              <div>
                <h4 className="font-medium mb-2">适合学员</h4>
                <div className="flex flex-wrap gap-2">
                  {course.prefer_students?.length > 0 ? course.prefer_students.map(student => (
                    <Badge key={student} variant="secondary">{student}</Badge>
                  )) : <p className="text-gray-600">暂无学员偏好信息</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coach" className="mt-4">
            <div className="space-y-4">
              <p className="text-gray-600">教练信息待完善</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-8">
          <button
            className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            请求时间
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}