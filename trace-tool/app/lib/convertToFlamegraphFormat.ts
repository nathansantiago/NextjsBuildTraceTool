import type { TraceNode } from "@/app/lib/buildTraceTree";

export interface FlameGraphData {
	name: string;
	value: number;
	children?: FlameGraphData[];
}

export function convertToFlamegraphFormat(tree: TraceNode[]): FlameGraphData {
	return {
		name: "root",
		value: tree.reduce((sum, node) => sum + node.duration, 0),
		children: tree.map(toFlameNode),
	};
}

function toFlameNode(node: TraceNode): FlameGraphData {
	return {
		name: node.name,
		value: node.duration,
		children: node.children.map(toFlameNode),
	};
}
