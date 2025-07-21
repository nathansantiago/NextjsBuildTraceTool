"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import FileUpload from "@/app/components/FileUpload";
import { buildTraceTree } from "@/app/lib/buildTraceTree";
import { convertToFlamegraphFormat } from "@/app/lib/convertToFlamegraphFormat";
import { useTraceStore } from "@/app/lib/traceStore";

// Dynamically import FlameGraph with no SSR to avoid browser-only library issues
const FlameGraph = dynamic(
	() => import("@/app/components/FlameGraph").then((mod) => ({ default: mod.FlameGraph })),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-64">
				<div className="text-gray-500">Loading flame graph...</div>
			</div>
		),
	}
);

export default function Home() {
	const traceEvents = useTraceStore((state) => state.traceEvents);
	const [selectedPageIdentifier, setSelectedPageIdentifier] = useState<string | null>(null);

	const flameGraphData = useMemo(() => {
		if (traceEvents.length === 0) return null;

		const tree = buildTraceTree(traceEvents);
		return convertToFlamegraphFormat(tree);
	}, [traceEvents]);

	const tagStats = useMemo(() => {
		if (traceEvents.length === 0) return null;

		const tags = new Map<string, Set<string>>();

		traceEvents.forEach((event) => {
			if (event.tags) {
				Object.entries(event.tags).forEach(([key, value]) => {
					if (!tags.has(key)) {
						tags.set(key, new Set());
					}
					tags.get(key)!.add(value);
				});
			}
		});

		return Array.from(tags.entries()).map(([key, values]) => ({
			key,
			values: Array.from(values),
			count: values.size,
		}));
	}, [traceEvents]);

	const pageAnalysis = useMemo(() => {
		if (traceEvents.length === 0) return null;

		const pageEvents = traceEvents.filter(
			(event) =>
				event.name.toLowerCase().includes("page") ||
				event.name.toLowerCase().includes("route") ||
				event.name.toLowerCase().includes("compile") ||
				event.name.toLowerCase().includes("build") ||
				(event.tags &&
					Object.values(event.tags).some(
						(value) =>
							typeof value === "string" &&
							(value.includes("/") ||
								value.includes("page") ||
								value.includes(".tsx") ||
								value.includes(".jsx") ||
								value.includes("app/"))
					))
		);

		// Group by file/route
		const groups = new Map<string, typeof pageEvents>();
		pageEvents.forEach((event) => {
			let identifier = "unknown";

			if (event.tags) {
				const fileTag = Object.values(event.tags).find(
					(value) =>
						typeof value === "string" &&
						(value.includes("/") || value.includes(".tsx") || value.includes(".jsx"))
				);
				if (fileTag) {
					identifier = fileTag;
				}
			}

			if (identifier === "unknown") {
				identifier = event.name;
			}

			if (!groups.has(identifier)) {
				groups.set(identifier, []);
			}
			groups.get(identifier)!.push(event);
		});

		// Convert to sorted array with statistics
		const analysis = Array.from(groups.entries())
			.map(([identifier, events]) => {
				const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0);
				const avgDuration = totalDuration / events.length;
				return {
					identifier,
					eventCount: events.length,
					totalDuration,
					avgDuration,
					events,
				};
			})
			.sort((a, b) => b.totalDuration - a.totalDuration);

		return {
			totalPageEvents: pageEvents.length,
			groups: analysis,
		};
	}, [traceEvents]);

	const debugInfo = useMemo(() => {
		if (traceEvents.length === 0) return null;

		const eventsWithoutIds = traceEvents.filter((e) => e.id === undefined);
		const pageRelatedEvents = traceEvents.filter(
			(e) =>
				e.name.includes("page") ||
				e.name.includes("route") ||
				e.name.includes("module") ||
				e.name.includes("resolve") ||
				e.name.includes("build") ||
				(e.tags &&
					Object.values(e.tags).some(
						(v) => typeof v === "string" && (v.includes("page") || v.includes("/"))
					))
		);

		const allEventNames = [...new Set(traceEvents.map((e) => e.name))].sort();

		return {
			total: traceEvents.length,
			withoutIds: eventsWithoutIds.length,
			pageRelated: pageRelatedEvents.length,
			uniqueNames: allEventNames.length,
			eventNames: allEventNames,
		};
	}, [traceEvents]);
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Next.js Build Trace Tool</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Upload your Next.js build trace file to analyze performance and identify bottlenecks in
						your build process.
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Trace File</h2>
					<FileUpload />
				</div>

				{flameGraphData && (
					<>
						<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">
									Flame Graph Visualization
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
									<div className="bg-blue-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-blue-600">{traceEvents.length}</div>
										<div className="text-sm text-gray-600">Total Events</div>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-green-600">
											{Math.round(flameGraphData.value)}ms
										</div>
										<div className="text-sm text-gray-600">Total Duration</div>
									</div>
									<div className="bg-purple-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-purple-600">
											{flameGraphData.children?.length || 0}
										</div>
										<div className="text-sm text-gray-600">Root Events</div>
									</div>
								</div>
							</div>
							<div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
								<div className="min-w-full">
									<FlameGraph data={flameGraphData} />
								</div>
							</div>
						</div>

						{tagStats && tagStats.length > 0 && (
							<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">Trace Metadata</h2>
								<p className="text-gray-600 mb-6">
									Additional information extracted from trace tags. Hover over flame graph segments
									to see detailed tag information.
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{tagStats.map(({ key, values }) => (
										<div key={key} className="bg-gray-50 p-4 rounded-lg">
											<h3 className="font-semibold text-gray-900 mb-2">{key}</h3>
											<div className="space-y-1">
												{values.map((value) => (
													<span
														key={value}
														className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1"
													>
														{value}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{pageAnalysis && pageAnalysis.groups.length > 0 && (
							<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">
									Page Compilation Analysis
								</h2>
								<p className="text-gray-600 mb-6">
									Detailed breakdown of compilation events by page/route. This shows which pages
									took the longest to compile.
								</p>

								<div className="mb-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-blue-600">
											{pageAnalysis.totalPageEvents}
										</div>
										<div className="text-sm text-gray-600">Total Page-Related Events</div>
									</div>
								</div>

								<div className="space-y-4">
									{pageAnalysis.groups
										.slice(0, 10)
										.map(({ identifier, eventCount, totalDuration, avgDuration }) => (
											<button
												key={identifier}
												type="button"
												className={`w-full border rounded-lg p-4 text-left transition-colors ${
													selectedPageIdentifier === identifier
														? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
														: "hover:bg-gray-50 hover:border-gray-300"
												}`}
												onClick={() =>
													setSelectedPageIdentifier(
														selectedPageIdentifier === identifier ? null : identifier
													)
												}
											>
												<div className="flex justify-between items-start mb-2">
													<h3 className="font-semibold text-gray-900 truncate flex-1 mr-4">
														{identifier}
													</h3>
													<div className="text-right">
														<div className="text-lg font-bold text-blue-600">
															{totalDuration.toFixed(2)}ms
														</div>
														<div className="text-xs text-gray-500">total duration</div>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4 text-sm">
													<div>
														<span className="text-gray-600">Events: </span>
														<span className="font-medium">{eventCount}</span>
													</div>
													<div>
														<span className="text-gray-600">Average: </span>
														<span className="font-medium">{avgDuration.toFixed(2)}ms</span>
													</div>
												</div>
												<div className="mt-2 text-xs text-gray-500">
													Click to {selectedPageIdentifier === identifier ? "hide" : "view"}{" "}
													detailed events
												</div>
											</button>
										))}
									{pageAnalysis.groups.length > 10 && (
										<div className="text-center text-gray-500 text-sm">
											... and {pageAnalysis.groups.length - 10} more
										</div>
									)}
								</div>
							</div>
						)}

						{selectedPageIdentifier && pageAnalysis && (
							<div className="bg-white rounded-lg shadow-lg p-8">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-2xl font-semibold text-gray-900">
										Events for: {selectedPageIdentifier}
									</h2>
									<button
										type="button"
										onClick={() => setSelectedPageIdentifier(null)}
										className="text-gray-500 hover:text-gray-700 text-sm"
									>
										Close
									</button>
								</div>

								{(() => {
									const selectedGroup = pageAnalysis.groups.find(
										(g) => g.identifier === selectedPageIdentifier
									);
									if (!selectedGroup) return null;

									return (
										<div>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
												<div className="bg-blue-50 p-4 rounded-lg">
													<div className="text-2xl font-bold text-blue-600">
														{selectedGroup.eventCount}
													</div>
													<div className="text-sm text-gray-600">Total Events</div>
												</div>
												<div className="bg-green-50 p-4 rounded-lg">
													<div className="text-2xl font-bold text-green-600">
														{selectedGroup.totalDuration.toFixed(2)}ms
													</div>
													<div className="text-sm text-gray-600">Total Duration</div>
												</div>
												<div className="bg-purple-50 p-4 rounded-lg">
													<div className="text-2xl font-bold text-purple-600">
														{selectedGroup.avgDuration.toFixed(2)}ms
													</div>
													<div className="text-sm text-gray-600">Average Duration</div>
												</div>
											</div>

											<div className="space-y-3">
												<h3 className="text-lg font-semibold text-gray-900 mb-3">
													Individual Events
												</h3>
												<div className="max-h-96 overflow-y-auto">
													{selectedGroup.events
														.sort((a, b) => b.duration - a.duration)
														.map((event, index) => (
															<div
																key={`${event.id}-${index}`}
																className="border rounded-lg p-4 bg-gray-50"
															>
																<div className="flex justify-between items-start mb-2">
																	<h4 className="font-medium text-gray-900">{event.name}</h4>
																	<span className="text-lg font-bold text-blue-600">
																		{event.duration.toFixed(2)}ms
																	</span>
																</div>
																<div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
																	<div>
																		<span className="font-medium">Start Time:</span>{" "}
																		{event.startTime.toFixed(2)}ms
																	</div>
																	<div>
																		<span className="font-medium">ID:</span> {event.id || "N/A"}
																	</div>
																	{event.parentId && (
																		<div>
																			<span className="font-medium">Parent ID:</span>{" "}
																			{event.parentId}
																		</div>
																	)}
																</div>
																{event.tags && Object.keys(event.tags).length > 0 && (
																	<div className="mt-3">
																		<div className="text-sm font-medium text-gray-700 mb-2">
																			Tags:
																		</div>
																		<div className="flex flex-wrap gap-1">
																			{Object.entries(event.tags).map(([key, value]) => (
																				<span
																					key={key}
																					className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
																				>
																					{key}: {value}
																				</span>
																			))}
																		</div>
																	</div>
																)}
															</div>
														))}
												</div>
											</div>
										</div>
									);
								})()}
							</div>
						)}

						{debugInfo && (
							<div className="bg-white rounded-lg shadow-lg p-8">
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">Debug Information</h2>
								<p className="text-gray-600 mb-6">
									Analysis of trace events to help identify page compilation details.
								</p>

								<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
									<div className="bg-gray-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-gray-800">{debugInfo.total}</div>
										<div className="text-sm text-gray-600">Total Events</div>
									</div>
									<div className="bg-yellow-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-yellow-600">{debugInfo.withoutIds}</div>
										<div className="text-sm text-gray-600">Events without IDs</div>
									</div>
									<div className="bg-blue-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-blue-600">{debugInfo.pageRelated}</div>
										<div className="text-sm text-gray-600">Page-related Events</div>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<div className="text-2xl font-bold text-green-600">{debugInfo.uniqueNames}</div>
										<div className="text-sm text-gray-600">Unique Event Types</div>
									</div>
								</div>

								<div>
									<h3 className="text-lg font-semibold text-gray-900 mb-3">All Event Types</h3>
									<div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
											{debugInfo.eventNames.map((name) => (
												<div
													key={name}
													className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded"
												>
													{name}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
