"use client";

import { create } from "zustand";
import type { TraceEvent } from "@/app/lib/parseTrace";

type TraceStore = {
	traceEvents: TraceEvent[];
	setTraceEvents: (events: TraceEvent[]) => void;
};

export const useTraceStore = create<TraceStore>((set) => ({
	traceEvents: [],
	setTraceEvents: (events) => set({ traceEvents: events }),
}));
