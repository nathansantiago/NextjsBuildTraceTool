"use client";

import * as d3 from "d3";
import { flamegraph } from "d3-flame-graph";
import "d3-flame-graph/dist/d3-flamegraph.css";
import { useEffect, useRef } from "react";
import type { FlameGraphData } from "@/app/lib/convertToFlamegraphFormat";

export function FlameGraph({ data }: { data: FlameGraphData }) {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!ref.current || !data) return;

		// Clear any existing content
		d3.select(ref.current).selectAll("*").remove();

		// Calculate responsive width based on container
		const containerWidth = ref.current.offsetWidth;
		const width = Math.max(containerWidth, 1400); // Minimum 1400px for better readability

		const chart = flamegraph()
			.width(width)
			.cellHeight(20)
			.minFrameSize(0.5)
			.transitionDuration(250)
			.tooltip(true);

		d3.select(ref.current).datum(data).call(chart);

		return () => {
			// Clean up by removing all child elements
			if (ref.current) {
				d3.select(ref.current).selectAll("*").remove();
			}
		};
	}, [data]);

	return <div ref={ref} className="w-full min-w-0" />;
}
