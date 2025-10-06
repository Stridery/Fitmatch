type EventName =
  | "search_submit"
  | "view_result_card"
  | "open_course_detail"
  | "click_request_time"
  | "load_more"
  | "search_error";

type EventPayload = Record<string, any>;

// 统一的埋点函数，便于后续替换为真实 SDK
export function logEvent(name: EventName, payload: EventPayload) {
  // TODO: 在 Step 11 替换为真实 SDK
  console.log(`[Analytics] ${name}:`, payload);
}


