import type { TraceEvent as ParsedTraceEvent } from "@/app/lib/parseTrace";

type TraceEvent = {
	id: number;
	parentId?: number;
	name: string;
	duration: number;
	startTime: number;
	tags?: Record<string, string>;
};

export type TraceNode = TraceEvent & { children: TraceNode[] };

export function buildTraceTree(events: ParsedTraceEvent[]): TraceNode[] {
	// Filter out events without ids and convert to TraceEvent format
	const validEvents: TraceEvent[] = events
		.filter((e): e is ParsedTraceEvent & { id: number } => e.id !== undefined)
		.map((e) => ({
			id: e.id,
			parentId: e.parentId,
			name: e.name,
			duration: e.duration,
			startTime: e.startTime,
			tags: e.tags,
		}));

	console.log(`Processing ${validEvents.length} valid events out of ${events.length} total events`);

	// Log events that might contain page-specific information
	const pageRelatedEvents = validEvents.filter(
		(e) =>
			e.name.toLowerCase().includes("page") ||
			e.name.toLowerCase().includes("route") ||
			e.name.toLowerCase().includes("module") ||
			e.name.toLowerCase().includes("resolve") ||
			e.name.toLowerCase().includes("build") ||
			e.name.toLowerCase().includes("compile") ||
			(e.tags &&
				Object.values(e.tags).some(
					(v) =>
						v.includes("page") ||
						v.includes("/") ||
						v.includes(".tsx") ||
						v.includes(".jsx") ||
						v.includes("app/")
				))
	);

	console.log(`Found ${pageRelatedEvents.length} page-related events`);

	// Group page events by potential route/file
	const pageGroups = new Map<string, TraceEvent[]>();
	pageRelatedEvents.forEach((event) => {
		let identifier = "unknown";

		// Try to extract route/file identifier from tags
		if (event.tags) {
			const fileTag = Object.values(event.tags).find(
				(v) => v.includes("/") || v.includes(".tsx") || v.includes(".jsx")
			);
			if (fileTag) {
				identifier = fileTag;
			}
		}

		// Use event name as fallback
		if (identifier === "unknown") {
			identifier = event.name;
		}

		if (!pageGroups.has(identifier)) {
			pageGroups.set(identifier, []);
		}
		pageGroups.get(identifier)!.push(event);
	});

	// Log page compilation summary
	console.log("Page compilation analysis:");
	pageGroups.forEach((events, identifier) => {
		const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);
		const avgDuration = totalDuration / events.length;
		console.log(
			`  ${identifier}: ${events.length} events, ${totalDuration}ms total, ${avgDuration.toFixed(2)}ms avg`
		);
	});

	if (pageRelatedEvents.length > 0) {
		console.log(
			"Sample page events:",
			pageRelatedEvents.slice(0, 3).map((e) => ({
				name: e.name,
				duration: e.duration,
				tags: e.tags,
			}))
		);
	}

	const idMap = new Map<number, TraceNode>();
	validEvents.forEach((e) => idMap.set(e.id, { ...e, children: [] }));

	const roots: TraceNode[] = [];

	idMap.forEach((node) => {
		if (node.parentId != null && idMap.has(node.parentId)) {
			idMap.get(node.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	});

	return roots;
}
