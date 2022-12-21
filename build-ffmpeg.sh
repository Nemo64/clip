#!/bin/bash

set -eo pipefail

if [ ! -e wasm ]
then
  echo "You'll need to checkout @ffmpeg/core and run this script within it."
  echo "Then, run at least these build scripts"
  echo "- wasm/build-scripts/install-deps.sh"
  echo "- wasm/build-scripts/build-zlib.sh"
  echo "- wasm/build-scripts/build-x264.sh"
  echo "- wasm/build-scripts/build-fdk-aac.sh"
  echo "- wasm/build-scripts/build-ogg.sh"
  echo "after that, you can run this script again to build the custom ffmpeg."
  echo "the result will be in wasm/packages/core/dist/*"
  exit 1
fi

# custom configuration with only what we actually need
source wasm/build-scripts/var.sh
# shellcheck disable=SC2054
FLAGS=(
  "${FFMPEG_CONFIG_FLAGS_BASE[@]}"
  --disable-all

  --enable-gpl            # required by x264
  --enable-nonfree        # required by fdk-aac
  --enable-zlib           # enable zlib
  --enable-libx264        # enable x264
  --enable-libfdk-aac     # enable libfdk-aac

  # basic requirements to process video
  --enable-protocol=file
  --enable-avcodec
  --enable-avformat
  --enable-avfilter
  --enable-swresample
  --enable-swscale

  # video container formats
  --enable-demuxer=avi
  --enable-demuxer=flac
  --enable-demuxer=flv
  --enable-demuxer=gif
  --enable-demuxer=m4v
  --enable-demuxer=matroska
  --enable-demuxer=mov # also mp4,m4a,3gp,3g2,mj2
  --enable-demuxer=mpeg*
  --enable-demuxer=ogg

  # video codecs
  --enable-decoder=av1
  --enable-decoder=gif
  --enable-decoder=h263 # common in 3gp files
  --enable-decoder=h264
  --enable-decoder=hevc
  --enable-decoder=mpeg*
  --enable-decoder=theora
  --enable-decoder=vp6*
  --enable-decoder=vp8
  --enable-decoder=vp9
  --enable-decoder=wmv*

  # audio codecs
  --enable-decoder=alac # Apple Lossless
  --enable-decoder=ac3
  --enable-decoder=dca # DTS audio
  --enable-decoder=flac
  --enable-decoder=libfdk_aac # aac; fdk instead of native since it's included anyway
  --enable-decoder=mp3
  --enable-decoder=opus
  --enable-decoder=pcm_*
  --enable-decoder=vorbis
  --enable-decoder=wma*

  # generic filters that ffmpeg adds automatically (everything breaks without them)
  # get_ost_filters https://github.com/FFmpeg/FFmpeg/blob/becbb22eb032149836070d13edf6b92f87780b35/fftools/ffmpeg_mux_init.c#L368
  --enable-filter=null,anull
  # insert_trim https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L355
  --enable-filter=trim,atrim
  # configure_output_video_filter https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L428
  --enable-filter=buffersink,scale,format,fps
  # configure_output_audio_filter https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L522
  --enable-filter=abuffersink,aformat # might be incomplete
  # configure_input_video_filter https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L710
  --enable-filter=transpose,hflip,vflip
  # configure_input_audio_filter https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L835
  --enable-filter=abuffer
  # negotiate_audio https://github.com/FFmpeg/FFmpeg/blob/41a558fea06cc0a23b8d2d0dfb03ef6a25cf5100/libavfilter/formats.c#L336
  --enable-filter=amix,aresample

  # normal video encode
  --enable-encoder=libfdk_aac,libx264
  --enable-parser=aac,h264
  --enable-muxer=mp4
  --enable-filter=fps,crop,scale,colorspace
  --enable-filter=amix,aresample

  # for timeline and gif encode
  --enable-demuxer=image_png_pipe # decodes png_files too
  --enable-decoder=png
  --enable-encoder=gif,png
  --enable-muxer=gif,image2
  --enable-parser=gif,png
  --enable-filter=mpdecimate,palettegen,paletteuse
)
echo "FFMPEG_CONFIG_FLAGS=${FLAGS[@]}"
emconfigure ./configure "${FLAGS[@]}"

# finally actually build ffmpeg
wasm/build-scripts/build-ffmpeg.sh
