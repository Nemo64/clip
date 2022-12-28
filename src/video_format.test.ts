import { expect, test } from "@jest/globals";
import { estimateH264Size } from "./video_format";

const testCases = [
  { width: 1280, height: 720, fps: 30, crf: 28, expectedBitrate: 2520 },
  { width: 1280, height: 720, fps: 30, crf: 21, expectedBitrate: 3360 },
  { width: 1280, height: 720, fps: 30, crf: 18, expectedBitrate: 3930 },
  { width: 1280, height: 720, fps: 30, crf: 12, expectedBitrate: 5890 },

  { width: 1280, height: 720, fps: 25, crf: 28, expectedBitrate: 2390 },
  { width: 1280, height: 720, fps: 25, crf: 21, expectedBitrate: 3180 },
  { width: 1280, height: 720, fps: 25, crf: 18, expectedBitrate: 3720 },
  { width: 1280, height: 720, fps: 25, crf: 12, expectedBitrate: 5570 },

  { width: 854, height: 480, fps: 30, crf: 28, expectedBitrate: 1120 },
  { width: 854, height: 480, fps: 30, crf: 21, expectedBitrate: 1500 },
  { width: 854, height: 480, fps: 30, crf: 18, expectedBitrate: 1750 },
  { width: 854, height: 480, fps: 30, crf: 12, expectedBitrate: 2620 },

  { width: 640, height: 360, fps: 30, crf: 28, expectedBitrate: 630 },
  { width: 640, height: 360, fps: 30, crf: 21, expectedBitrate: 840 },
  { width: 640, height: 360, fps: 30, crf: 18, expectedBitrate: 980 },
  { width: 640, height: 360, fps: 30, crf: 12, expectedBitrate: 1470 },
];

for (const testCase of testCases) {
  test(`${testCase.width}x${testCase.height}@${testCase.fps} crf:${testCase.crf}`, () => {
    const bitrate = estimateH264Size(testCase, testCase.crf);
    expect(Math.round(bitrate / 10) * 10).toBe(testCase.expectedBitrate);
  });
}
