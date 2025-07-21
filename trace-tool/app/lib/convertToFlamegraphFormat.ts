import type { TraceNode } from "@/app/lib/buildTraceTree";

export interface FlameGraphData {
	name: string;
	value: number;
	children?: FlameGraphData[];
	// Add additional metadata for tooltips and display
	detail?: string;
	tags?: Record<string, string>;
	duration?: number;
}

export function convertToFlamegraphFormat(tree: TraceNode[]): FlameGraphData {
	return {
		name: "root",
		value: tree.reduce((sum, node) => sum + node.duration, 0),
		children: tree.map(toFlameNode),
	};
}

function toFlameNode(node: TraceNode): FlameGraphData {
	// Create enhanced name with key tag information
	const enhancedName = createEnhancedName(node);

	// Create detailed description for tooltips
	const detail = createDetailString(node);

	return {
		name: enhancedName,
		value: node.duration,
		detail,
		tags: node.tags,
		duration: node.duration,
		children: node.children.map(toFlameNode),
	};
}

function createEnhancedName(node: TraceNode): string {
	let name = node.name;

	// Add duration information to the name for better visibility
	const durationText = ` (${node.duration}ms)`;

	// Add important tag information to the display name
	if (node.tags) {
		const importantTags = [];

		// Add webpack compilation type if available
		if (node.tags.name) {
			importantTags.push(`[${node.tags.name}]`);
		}

		// Add version info if available
		if (node.tags.version) {
			importantTags.push(`v${node.tags.version}`);
		}

		// Add trigger info if available
		if (node.tags.trigger) {
			importantTags.push(`(${node.tags.trigger})`);
		}

		if (importantTags.length > 0) {
			name = `${name} ${importantTags.join(" ")}`;
		}
	}

	// Add duration at the end
	name += durationText;

	return name;
}

function createDetailString(node: TraceNode): string {
	const details = [
		`Name: ${node.name}`,
		`Duration: ${node.duration}ms`,
		`Start Time: ${node.startTime}`,
	];

	if (node.tags && Object.keys(node.tags).length > 0) {
		details.push("Tags:");
		Object.entries(node.tags).forEach(([key, value]) => {
			details.push(`  ${key}: ${value}`);
		});
	}

	return details.join("\n");
}
