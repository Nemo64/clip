import { expect, test } from "@jest/globals";
import { estimateH264Size } from "./video_format";

const testCases = [
  { width: 1280, height: 720, fps: 30, crf: 28, expectedBitrate: 2310 },
  { width: 1280, height: 720, fps: 30, crf: 21, expectedBitrate: 4100 },
  { width: 1280, height: 720, fps: 30, crf: 18, expectedBitrate: 5580 },
  { width: 1280, height: 720, fps: 30, crf: 12, expectedBitrate: 12560 },

  { width: 1280, height: 720, fps: 25, crf: 28, expectedBitrate: 2180 },
  { width: 1280, height: 720, fps: 25, crf: 21, expectedBitrate: 3880 },
  { width: 1280, height: 720, fps: 25, crf: 18, expectedBitrate: 5280 },
  { width: 1280, height: 720, fps: 25, crf: 12, expectedBitrate: 11890 },

  { width: 854, height: 480, fps: 30, crf: 28, expectedBitrate: 1030 },
  { width: 854, height: 480, fps: 30, crf: 21, expectedBitrate: 1820 },
  { width: 854, height: 480, fps: 30, crf: 18, expectedBitrate: 2480 },
  { width: 854, height: 480, fps: 30, crf: 12, expectedBitrate: 5590 },

  { width: 640, height: 360, fps: 30, crf: 28, expectedBitrate: 580 },
  { width: 640, height: 360, fps: 30, crf: 21, expectedBitrate: 1030 },
  { width: 640, height: 360, fps: 30, crf: 18, expectedBitrate: 1400 },
  { width: 640, height: 360, fps: 30, crf: 12, expectedBitrate: 3140 },
];

for (const testCase of testCases) {
  test(`${testCase.width}x${testCase.height}@${testCase.fps} crf:${testCase.crf}`, () => {
    const bitrate = estimateH264Size(testCase, testCase.crf);
    expect(Math.round(bitrate / 10) * 10).toBe(testCase.expectedBitrate);
  });
}
