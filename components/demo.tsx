import { Crop, Timeline } from "./timeline";
import { useState } from "react";

const DEMO_TIMELINE: Crop = { start: 0, duration: 888 };
const DEMO_IMAGES = [...Array(28)].map(
  (_, i) => `/demo/${(i + 1).toString().padStart(2, "0")}.jpeg`
);

export function DemoTimeline() {
  const [demoCrop, setDemoCrop] = useState<Crop>({
    start: DEMO_TIMELINE.start,
    duration: DEMO_TIMELINE.duration * 0.75,
  });

  return (
    <Timeline
      frame={DEMO_TIMELINE}
      width={640}
      height={272}
      value={demoCrop}
      onChange={setDemoCrop}
      pics={DEMO_IMAGES}
      picInt={DEMO_TIMELINE.duration / DEMO_IMAGES.length}
    />
  );
}
