import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PopupHeader } from "./popup-header";

export function SignedInView() {
	return (
		<div className="w-72 space-y-4 p-4">
			<PopupHeader />
			<div className="relative">
				<Button disabled size="lg" className="w-full">
					Sync Instagram
				</Button>
				<Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs">
					Coming soon
				</Badge>
			</div>
		</div>
	);
}
