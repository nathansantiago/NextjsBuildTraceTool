declare module "d3-flame-graph" {
	export interface FlameGraphChart {
		width(width: number): FlameGraphChart;
		cellHeight(height: number): FlameGraphChart;
		minFrameSize(size: number): FlameGraphChart;
		transitionDuration(duration: number): FlameGraphChart;
		tooltip(enabled: boolean): FlameGraphChart;
		tooltipContent(formatter: (d: unknown) => string): FlameGraphChart;
		destroy?(): void;
		(selection: unknown): void;
	}

	export function flamegraph(): FlameGraphChart;
}
