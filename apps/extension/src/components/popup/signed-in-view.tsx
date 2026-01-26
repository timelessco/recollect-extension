import { Badge } from "@repo/shadcn-ui/components/ui/badge";
import { Button } from "@repo/shadcn-ui/components/ui/button";

import { PopupHeader } from "./popup-header";

export function SignedInView() {
  return (
    <div className="w-72 space-y-4 p-4">
      <PopupHeader />
      <div className="relative">
        <Button className="w-full" disabled size="lg">
          Sync Instagram
        </Button>
        <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs">
          Coming soon
        </Badge>
      </div>
    </div>
  );
}
