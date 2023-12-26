import { VideoTimeline } from "./video_timeline";
import { useState } from "react";
import { Link } from "./link";
import { Cut, Modification } from "../src/video_convert_instructions";

const DEMO_TIMELINE: Cut = { start: 0, duration: 60 };
const DEMO_IMAGES = [...Array(28)].map(
  (_, i) => `/demo/frame_${(i + 1).toString()}.jpg`
);

export function DemoTimeline({
  className,
  ...props
}: Partial<Parameters<typeof VideoTimeline>[0]>) {
  const [demoCrop, setDemoCrop] = useState<Modification>({
    cuts: [
      {
        start: DEMO_TIMELINE.start,
        duration: DEMO_TIMELINE.duration * 0.3,
      },
      {
        start: DEMO_TIMELINE.duration * 0.5,
        duration: DEMO_TIMELINE.duration * 0.25,
      },
    ],
    crop: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  return (
    <div className={className}>
      <VideoTimeline
        {...props}
        videoSrc={"/demo/Sintel.low.mp4"}
        frame={DEMO_TIMELINE}
        width={640}
        height={272}
        value={demoCrop}
        fps={24}
        muted={true}
        onChange={setDemoCrop}
        pics={DEMO_IMAGES}
        videoClassName={"object-cover"}
      />
      <Link
        href="http://www.sintel.org/"
        className="block opacity-50 text-center text-sm"
      >
        Video © copyright Blender Foundation | www.sintel.org
      </Link>
    </div>
  );
}
