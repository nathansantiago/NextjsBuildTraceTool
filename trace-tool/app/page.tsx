"use server";

import FileUpload from "@/app/components/FileUpload";

export default async function Home() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Next.js Build Trace Tool</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Upload your Next.js build trace file to analyze performance and identify bottlenecks in
						your build process.
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Trace File</h2>
					<FileUpload />
				</div>
			</div>
		</div>
	);
}
