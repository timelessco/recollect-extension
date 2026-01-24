import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PopupHeader } from "./popup-header";

export function SignedInView() {
	return (
		<div className="w-72 space-y-4 p-4">
			<PopupHeader />
			<Button disabled size="lg" className="w-full">
				Sync Instagram
				<Badge variant="secondary" className="ml-2">
					Coming soon
				</Badge>
			</Button>
		</div>
	);
}
