"use client";

import * as Progress from "@radix-ui/react-progress";
import { useEffect, useState } from "react";

export default function RadixProgressBar({ isLoading }: { isLoading: boolean }) {
	const [progress, setProgress] = useState(13);

	useEffect(() => {
		if (!isLoading) return setProgress(0);

		const interval = setInterval(() => {
			setProgress((prev) => (prev < 95 ? prev + Math.random() * 5 : prev));
		}, 200);

		return () => clearInterval(interval);
	}, [isLoading]);

	return (
		<Progress.Root className="relative overflow-hidden bg-gray-200 rounded h-2 w-full">
			<Progress.Indicator
				className="bg-black h-full transition-all"
				style={{ transform: `translateX(-${100 - progress}%)` }}
			/>
		</Progress.Root>
	);
}
