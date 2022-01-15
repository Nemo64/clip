import {expect, test} from "@jest/globals";
import {Format} from "./video";
import {parseMetadata} from "./video_analyse";

const videoStrings = [
  'Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 640x360, 101 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)',
  'Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1516x1080 [SAR 1888:1889 DAR 357776:255015], 450 kb/s, SAR 26429:26443 DAR 853:608, 60 fps, 60 tbr, 15360 tbn, 120 tbc (default)',
  'Stream #0:0(und): Video: h264 (Main) (avc1 / 0x31637661), yuv420p(tv, bt709), 1452x1062 [SAR 1:1 DAR 242:177], 1559 kb/s, 53.33 fps, 60 tbr, 6k tbn, 12k tbc (default)',
  'Stream #0:0[0x1011]: Video: h264 (High) (HDMV / 0x564D4448), yuv420p(top first), 1440x1080 [SAR 4:3 DAR 16:9], 25 fps, 50 tbr, 90k tbn, 50 tbc'
];

for (let i = 0; i < videoStrings.length; ++i) {
  test(`parse video string ${videoStrings[i]}`, () => {
    const metadata: Partial<Format> = {
      container: {duration: 60, start: 0},
    };
    parseMetadata(videoStrings[i], metadata);
    expect(metadata.video).toBeDefined();
  });
}

const audioStrings = [
  'Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 128 kb/s (default)',
  'Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 194 kb/s (default)',
];

for (let i = 0; i < audioStrings.length; ++i) {
  test(`parse audio string ${audioStrings[i]}`, () => {
    const metadata: Partial<Format> = {
      container: {duration: 60, start: 0},
    };
    parseMetadata(audioStrings[i], metadata);
    expect(metadata.audio).toBeDefined();
    expect(metadata.audio?.codec).toBe('aac (LC)');
  });
}
