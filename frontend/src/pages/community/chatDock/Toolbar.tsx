import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserPicker from "./UserPicker";

export default function Toolbar() {
  const [openPicker, setOpenPicker] = useState(false);
  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" variant="default" onClick={() => setOpenPicker((v) => !v)}>
        New Chat
      </Button>
      {openPicker && <UserPicker />}
    </div>
  );
}

