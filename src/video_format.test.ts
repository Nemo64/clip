import { expect, test } from "@jest/globals";
import { computeSize } from "./video_format";

const testCases = [
  { width: 1280, height: 720, fps: 30, crf: 28, expectedBitrate: 1680 },
  { width: 1280, height: 720, fps: 30, crf: 21, expectedBitrate: 2240 },
  { width: 1280, height: 720, fps: 30, crf: 18, expectedBitrate: 2620 },
  { width: 1280, height: 720, fps: 30, crf: 12, expectedBitrate: 3930 },

  { width: 1280, height: 720, fps: 25, crf: 28, expectedBitrate: 1590 },
  { width: 1280, height: 720, fps: 25, crf: 21, expectedBitrate: 2120 },
  { width: 1280, height: 720, fps: 25, crf: 18, expectedBitrate: 2480 },
  { width: 1280, height: 720, fps: 25, crf: 12, expectedBitrate: 3720 },

  { width: 854, height: 480, fps: 30, crf: 28, expectedBitrate: 750 },
  { width: 854, height: 480, fps: 30, crf: 21, expectedBitrate: 1000 },
  { width: 854, height: 480, fps: 30, crf: 18, expectedBitrate: 1160 },
  { width: 854, height: 480, fps: 30, crf: 12, expectedBitrate: 1750 },

  { width: 640, height: 360, fps: 30, crf: 28, expectedBitrate: 420 },
  { width: 640, height: 360, fps: 30, crf: 21, expectedBitrate: 560 },
  { width: 640, height: 360, fps: 30, crf: 18, expectedBitrate: 650 },
  { width: 640, height: 360, fps: 30, crf: 12, expectedBitrate: 980 },
];

for (const testCase of testCases) {
  test(`${testCase.width}x${testCase.height}@${testCase.fps} crf:${testCase.crf}`, () => {
    const bitrate = computeSize(testCase, 8, testCase.crf);
    expect(Math.round(bitrate / 10) * 10).toBe(testCase.expectedBitrate);
  });
}
