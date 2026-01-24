import { Skeleton } from "@/components/ui/skeleton";

export function PopupSkeleton() {
	return (
		<div className="w-72 space-y-4 p-4">
			<Skeleton className="mx-auto h-6 w-24" />
			<Skeleton className="mx-auto h-4 w-48" />
			<Skeleton className="h-8 w-full" />
		</div>
	);
}
