import { Button } from "@/components/ui/button";
import { useChatDockStore } from "./store";

export default function MessageButton({ userId, children }: { userId: string; children?: React.ReactNode }) {
  const startDM = useChatDockStore((s) => s.startDM);
  return (
    <Button onClick={() => startDM(userId)}>{children ?? "Message"}</Button>
  );
}

