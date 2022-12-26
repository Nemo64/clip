import { Crop, VideoTimeline } from "./video_timeline";
import { useState } from "react";
import { Link } from "./link";

const DEMO_TIMELINE: Crop = { start: 0, duration: 60 };
const DEMO_IMAGES = [...Array(28)].map(
  (_, i) => `/demo/frame_${(i + 1).toString()}.jpg`
);

export function DemoTimeline({
  className,
  ...props
}: Partial<Parameters<typeof VideoTimeline>[0]>) {
  const [demoCrop, setDemoCrop] = useState<Crop>({
    start: DEMO_TIMELINE.start,
    duration: DEMO_TIMELINE.duration * 0.75,
  });

  return (
    <div className={className}>
      <VideoTimeline
        {...props}
        videoSrc={"/demo/sintel-2048-surround.clip.mp4"}
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
