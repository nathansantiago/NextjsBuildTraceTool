"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { parseTrace } from "@/app/lib/parseTrace";
import { useTraceStore } from "@/app/lib/traceStore";
import RadixProgressBar from "./RadixProgress";

const FileUpload = () => {
	const setTraceEvents = useTraceStore((state) => state.setTraceEvents);
	const [isLoading, setIsLoading] = useState(false);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) {
				toast.error("No file selected");
				return;
			}

			setIsLoading(true);
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const text = reader.result as string;
					const result = parseTrace(text);
					setTraceEvents(result.events);

					// Show success message with warnings if any
					if (result.events.length === 0) {
						toast.warning("No trace events could be parsed from the file");
					} else if (result.warnings.length > 0) {
						toast.success(`Successfully parsed ${result.events.length} trace events`);
						toast.warning(`${result.warnings.length} lines couldn't be parsed and were ignored`, {
							duration: 5000, // Show for 5 seconds
						});
					} else {
						toast.success(`Successfully parsed ${result.events.length} trace events`);
					}
				} catch (error) {
					toast.error(
						`Error parsing file: ${error instanceof Error ? error.message : "Unknown error"}`
					);
				} finally {
					setIsLoading(false);
				}
			};

			reader.onerror = () => {
				toast.error("Failed to read file.");
				setIsLoading(false);
			};

			reader.readAsText(file);
		},
		[setTraceEvents]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		multiple: false,
	});

	return (
		<div>
			<div
				{...getRootProps()}
				className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors ${
					isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
				}`}
			>
				<input {...getInputProps()} />
				{isDragActive ? (
					<p className="text-blue-600">Drop the trace file here...</p>
				) : (
					<div>
						<p className="text-gray-600 mb-2">
							Drag & drop your trace file here, or click to upload
						</p>
						<p className="text-sm text-gray-500">Accepts any file type</p>
					</div>
				)}
			</div>
			{isLoading && (
				<div className="mt-4">
					<p className="text-sm text-gray-600 mb-2">Processing trace file...</p>
					<RadixProgressBar isLoading={isLoading} />
				</div>
			)}
		</div>
	);
};

export default FileUpload;
