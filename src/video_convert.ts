import {createResolution, ConvertedVideo, Format, KnownVideo} from "./video";

/**
 * Starts the converting process.
 *
 */
export async function convertVideo(
  {file, ffmpeg, metadata}: KnownVideo,
  format: Format,
  onProgress: (percent: number) => void,
): Promise<ConvertedVideo> {
  const args: string[] = ['-hide_banner', '-y'];

  args.push(...seekArguments(metadata, format));
  !format.audio && args.push('-an'); // no audio (if not specified)
  args.push('-sn'); // no subtitles
  args.push('-dn'); // no data streams
  args.push('-i', file.name);
  args.push(...videoArguments(metadata, format));
  format.audio && args.push(...audioArguments(metadata, format));
  args.push('-f', 'mp4'); // use mp4 since it has the best compatibility as long as all streams are supported
  args.push('-movflags', '+faststart'); // moves metadata to the beginning of the mp4 container ~ useful for streaming
  args.push(`output ${file.name}`);

  // frame= 1199 fps= 23 q=31.0 size=    4096kB time=00:00:40.26 bitrate= 833.4kbits/s dup=0 drop=685 speed=0.773x
  ffmpeg.setLogger(({message}) => {
    const match = message.match(/time=\s*(?<time>\d+:\d+:\d+\.\d+)/);
    if (match?.groups?.time) {
      const time = match.groups.time.split(':').map(parseFloat).reduce((acc, val) => acc * 60 + val);
      onProgress(time / format.container.duration * 100);
    }
  });

  await ffmpeg.run(...args);
  const result = ffmpeg.FS('readFile', `output ${file.name}`);
  ffmpeg.setLogger(() => void 0);

  const newFileName = file.name.replace(/\.\w{2,4}$|$/, ".mp4");
  return {
    status: "converted",
    file: new File([result], newFileName, {type: 'video/mp4'}),
    metadata: format,
  };
}

export function createPreviews(
  {file, ffmpeg, metadata}: KnownVideo,
  interval: number,
): AsyncIterableIterator<File> {
  const args: string[] = ['-hide_banner', '-y'];

  // use some tricks to decode faster for the preview
  args.push('-skip_frame', interval > 2 ? 'nokey' : 'bidir', '-vsync', '2');
  args.push('-flags2', 'fast'); // https://stackoverflow.com/a/54873148
  // decode at lower resolution; 1920 / 4 = 480; so create previews at 480 width ~ although h264 does not support this
  const {width, height} = createResolution(metadata, 480, 270);
  const lowres = Math.floor(Math.log2(metadata.video.width / width));
  if (lowres >= 1) {
    args.push('-lowres:v', Math.min(3, lowres).toString());
  }
  args.push('-an'); // no audio
  args.push('-sn'); // no subtitles
  args.push('-dn'); // no data streams
  args.push('-i', file.name);
  args.push('-r', `1/${interval}`);
  args.push('-sws_flags', 'neighbor');
  args.push('-s:v', `${width}x${height}`);
  args.push('-f', `image2`);
  args.push('-q:v', `10`); // 1-31, lower is better quality
  args.push('frame_%d.jpg');

  const execution = ffmpeg.run(...args);

  return (async function* () {
    const frames = Math.floor(metadata.container.duration / interval);
    let done = false;
    let lastFrame = Date.now();
    for (let i = 1; i <= frames;) {
      try {
        const blob = ffmpeg.FS('readFile', `frame_${i}.jpg`);
        ffmpeg.FS('unlink', `frame_${i}.jpg`);
        i++;
        yield new File([blob], `frame_${i}.jpg`, {type: 'image/jpeg'});
        lastFrame = Date.now();
      } catch {
        if (lastFrame + 10000 < Date.now()) {
          console.error('generate thumbnails timeout', lastFrame);
          break;
        } else if (done) {
          i++; // increase even with read error
        } else {
          done = !await Promise.race([
            new Promise(r => setTimeout(r, 200, true)),
            execution,
          ]);
        }
      }
    }
  })();
}

function seekArguments(metadata: Format, format: Format) {
  const args: string[] = [];

  // TODO: check what it means if the source video has a start time !== 0
  if (format.container.start > metadata.container.start) {
    args.push('-ss', String(format.container.start));
  }

  if (format.container.duration < metadata.container.duration - format.container.start) {
    args.push('-t', String(format.container.duration));
  }

  return args;
}

function videoArguments(metadata: Format, format: Format) {
  const args: string[] = [];

  if (!format.video || format.video.codec === 'none') {
    args.push('-vn');
    return args;
  }

  args.push('-pix_fmt:v', format.video.color);
  args.push('-sws_flags', 'bilinear');

  if (format.video.width !== metadata.video.width || format.video.height !== metadata.video.height) {
    args.push('-s:v', `${format.video.width}x${format.video.height}`);
  }

  if (metadata.video.fps > format.video.fps) {
    args.push('-r:v', format.video.fps.toString());
  }

  if (format.video.codec.startsWith('h264')) {
    args.push('-c:v', 'libx264');
    args.push('-preset:v', 'fast');
    // args.push('-level:v', '4.0'); // https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels
    args.push('-profile:v', 'high');

    if (format.video.crf) {
      args.push('-crf:v', format.video.crf.toString());
    } else if (format.video.bitrate) {
      args.push('-b:v', `${format.video.bitrate}k`);
    } else {
      throw new Error("No video bitrate or crf specified");
    }
  } else {
    throw new Error(`Unsupported video codec: ${format.video.codec}`);
  }

  return args;
}

function audioArguments(metadata: Format, format: Format) {
  const args: string[] = [];

  if (!format.audio || format.audio.codec === 'none') {
    args.push('-an');
    return args;
  }

  // @ts-ignore: typescript does not like treating objects as records
  const sourceIdentical = metadata.audio?.codec === format.audio.codec
    && metadata.audio.sampleRate === format.audio.sampleRate
    && metadata.audio.channelSetup === format.audio.channelSetup
    && metadata.audio.bitrate <= format.audio.bitrate
  if (sourceIdentical) {
    args.push('-c:a', 'copy');
    return args;
  }

  args.push('-ar', format.audio.sampleRate.toString());

  if (format.audio.codec.startsWith('aac')) {
    args.push('-c:a', 'libfdk_aac');
    args.push('-b:a', `${format.audio.bitrate}k`);
    args.push('-ac', '2'); // always force stereo (mono untested)
    args.push('-strict', '-2');
    if (format.audio.channelSetup === 'stereo' && format.audio.bitrate <= 48) {
      args.push('-profile:a', 'aac_he_v2');
    } else if (format.audio.channelSetup === 'mono' && format.audio.bitrate <= 48 || format.audio.bitrate <= 72) {
      args.push('-profile:a', 'aac_he');
    }
  } else {
    throw new Error(`Unsupported audio codec: ${format.audio.codec}`);
  }

  return args;
}
