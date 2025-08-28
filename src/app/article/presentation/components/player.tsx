import { useCallback, useRef, useState } from "react";
import {
  WaveSurfer as WaveSurferPlayer,
  Region,
  WaveForm,
} from "wavesurfer-react";
import RegionsPlugin, {
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";
import WaveSurfer from "wavesurfer.js";
import type { RegionPluginEventListener } from "wavesurfer-react/dist/hooks/useRegionPluginEvent";
import type { PluginType } from "wavesurfer-react/dist/types";
import type { GenericPlugin } from "wavesurfer.js/dist/base-plugin.js";
import { Button } from "../../../shared/presentation/components/ui/button";
import type { RegionEventListener } from "wavesurfer-react/dist/hooks/useRegionEvent";
import {
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  Repeat2,
} from "lucide-react";
import { Toggle } from "../../../shared/presentation/components/ui/toggle";

function splitOnSilence(
  channelData: Float32Array,
  sampleRate: number,
  silenceThreshold = -30,
  minSilenceDuration = 500,
) {
  const silenceThresholdLinear = Math.pow(10, silenceThreshold / 20);
  const minSilenceSamples = (sampleRate / 1000) * minSilenceDuration;

  const sentences: Array<[number, number]> = [];
  let state: "InSentence" | "DetectingSilence" | "InSilence" = "InSentence";
  let sentenceStart = 0;
  let silenceStart = 0;
  for (let i = 0; i < channelData.length; ++i) {
    const isSilence = Math.abs(channelData[i]) < silenceThresholdLinear;
    switch (state as "InSentence" | "DetectingSilence" | "InSilence") {
      case "InSentence":
        if (isSilence) {
          state = "DetectingSilence";
          silenceStart = i;
        }
        break;
      case "DetectingSilence":
        if (!isSilence) {
          state = "InSentence";
        } else if (i - silenceStart > minSilenceSamples) {
          state = "InSilence";
        }
        break;
      case "InSilence":
        if (!isSilence) {
          state = "InSentence";
          const silenceLength = i - silenceStart;
          sentences.push([sentenceStart, i - silenceLength / 2]);
          sentenceStart = i - silenceLength / 4;
          silenceStart = 0;
        }
        break;
    }
  }
  sentences.push([sentenceStart, channelData.length]);
  return sentences;
}

export function Player({ url }: { url: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loopRegion, setLoopRegion] = useState(false);
  const [regions, setRegions] = useState<
    Array<{
      start: number;
      end: number;
      color: string;
    }>
  >([]);
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const plugins = [
    {
      key: "regions",
      plugin: RegionsPlugin,
      options: { dragSelection: false },
    },
  ];
  const wavesurferRef = useRef<WaveSurfer>(null);
  const mounted = useCallback(
    (waveSurfer: WaveSurfer | null) => {
      if (waveSurfer === null) return;
      wavesurferRef.current = waveSurfer;
      if (wavesurferRef.current) {
        wavesurferRef.current.load(url);
        wavesurferRef.current.on("ready", () => {
          const decodedData = wavesurferRef.current!.getDecodedData()!;
          const channelData = decodedData.getChannelData(0);
          const regions = splitOnSilence(
            channelData,
            decodedData.sampleRate,
          ).map(([start, end], i) => {
            return {
              start: start / decodedData.sampleRate,
              end: end / decodedData.sampleRate,
              color:
                i % 2 == 0
                  ? "rgba(225, 195, 100, .5)"
                  : "rgba(25, 95, 195, .5)",
            };
          });
          setRegions(regions);
          setIsLoaded(true);
        });
      }
    },
    [url],
  );
  const onPlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    wavesurferRef.current?.playPause();
  }, [isPlaying]);

  function lastSentence() {
    const currentTime = wavesurferRef.current?.getCurrentTime() ?? 0;
    const regionPlugin =
      wavesurferRef.current?.getActivePlugins()[0] as RegionsPlugin;
    const regions = regionPlugin.getRegions();
    const currentRegionIndex = parseInt(currentRegion!);
    if (currentTime - regions[currentRegionIndex].start < 0.75) {
      if (currentRegionIndex && currentRegionIndex !== 0) {
        regions[currentRegionIndex - 1].play();
      }
    } else {
      regions[currentRegionIndex].play();
    }
  }
  function nextSentence() {
    const regionPlugin =
      wavesurferRef.current?.getActivePlugins()[0] as RegionsPlugin;
    const regions = regionPlugin.getRegions();
    const currentRegionIndex = parseInt(currentRegion!);
    if (currentRegionIndex + 1 < regions.length) {
      regions[currentRegionIndex + 1].play();
    }
  }
  return (
    <>
      <WaveSurferPlayer
        height={50}
        plugins={plugins as unknown as PluginType<GenericPlugin>[]}
        onMount={mounted}
        container="#waveform"
      >
        <WaveForm id="waveform"></WaveForm>
        {isLoaded &&
          regions.map((regionProps, i) => (
            <Region
              key={i}
              id={i.toString()}
              {...regionProps}
              drag={false}
              resize={false}
              onIn={
                ((e: RegionType) => {
                  if (e?.id === i.toString()) {
                    setCurrentRegion(e.id);
                  }
                }) as RegionPluginEventListener
              }
              onOut={
                ((e: RegionType) => {
                  if (e?.id === i.toString()) {
                    if (loopRegion && currentRegion === e?.id) {
                      e.play();
                      setCurrentRegion(e.id);
                    }
                  }
                }) as RegionPluginEventListener
              }
              onClick={
                ((e: RegionType) => {
                  if (e?.id === i.toString()) {
                    if (loopRegion && currentRegion === e?.id) {
                      e.play();
                      setCurrentRegion(e.id);
                    }
                  }
                }) as RegionEventListener
              }
            />
          ))}
      </WaveSurferPlayer>
      <div className="flex gap-2 items-center">
        <Button onClick={onPlayPause} className="my-2 p-0">
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button onClick={lastSentence} className="my-2 p-0">
          <ChevronsLeft className="h-5 w-5" />
        </Button>
        <Button onClick={nextSentence} className="my-2 p-0">
          <ChevronsRight className="h-5 w-5" />
        </Button>
        <Toggle
          aria-label="Loop sentence"
          pressed={loopRegion}
          onPressedChange={setLoopRegion}
        >
          <Repeat2 />
        </Toggle>
      </div>
    </>
  );
}
