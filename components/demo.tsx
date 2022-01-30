import { Crop, Timeline } from "./timeline";
import { useState } from "react";

const DEMO_TIMELINE: Crop = { start: 0, duration: 888 };
const DEMO_IMAGES = [...Array(28)].map(
  (_, i) => `/demo/${(i + 1).toString().padStart(2, "0")}.jpeg`
);

export function DemoTimeline(props: Partial<Parameters<typeof Timeline>[0]>) {
  const [demoCrop, setDemoCrop] = useState<Crop>({
    start: DEMO_TIMELINE.start,
    duration: DEMO_TIMELINE.duration * 0.75,
  });

  return (
    <Timeline
      {...props}
      frame={DEMO_TIMELINE}
      width={640}
      height={272}
      value={demoCrop}
      fps={24}
      onChange={setDemoCrop}
      pics={DEMO_IMAGES}
      picInt={DEMO_TIMELINE.duration / DEMO_IMAGES.length}
    />
  );
}
