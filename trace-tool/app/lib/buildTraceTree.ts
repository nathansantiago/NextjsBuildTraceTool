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
