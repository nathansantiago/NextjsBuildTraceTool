"use client";

import { z } from "zod";

export const TraceEventSchema = z.object({
	name: z.string(),
	duration: z.number(),
	timestamp: z.number().optional(),
	id: z.number().optional(),
	parentId: z.number().optional(),
	tags: z.record(z.string(), z.string()).optional(),
	startTime: z.number(),
	traceId: z.string(),
});

export type TraceEvent = z.infer<typeof TraceEventSchema>;

export const TraceFileSchema = z.array(TraceEventSchema);

export type ParseResult = {
	events: TraceEvent[];
	warnings: string[];
};

export function parseTrace(raw: string): ParseResult {
	const lines = raw.trim().split("\n");
	const allEvents: TraceEvent[] = [];
	const warnings: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim()) {
			try {
				const parsed = JSON.parse(line);
				// If it's an array, add all events
				if (Array.isArray(parsed)) {
					const events = TraceFileSchema.parse(parsed);
					allEvents.push(...events);
				} else {
					// If it's a single event, validate and add it
					const event = TraceEventSchema.parse(parsed);
					allEvents.push(event);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				warnings.push(
					`Line ${i + 1}: ${errorMessage} - "${line.substring(0, 100)}${line.length > 100 ? "..." : ""}"`
				);
			}
		}
	}

	return { events: allEvents, warnings };
}
