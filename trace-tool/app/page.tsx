"use client";

import { useMemo } from "react";
import FileUpload from "@/app/components/FileUpload";
import { FlameGraph } from "@/app/components/FlameGraph";
import { buildTraceTree } from "@/app/lib/buildTraceTree";
import { convertToFlamegraphFormat } from "@/app/lib/convertToFlamegraphFormat";
import { useTraceStore } from "@/app/lib/traceStore";

export default function Home() {
	const traceEvents = useTraceStore((state) => state.traceEvents);

	const flameGraphData = useMemo(() => {
		if (traceEvents.length === 0) return null;

		const tree = buildTraceTree(traceEvents);
		return convertToFlamegraphFormat(tree);
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
					<div className="bg-white rounded-lg shadow-lg p-8">
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
				)}
			</div>
		</div>
	);
}
