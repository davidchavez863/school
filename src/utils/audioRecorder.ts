import { makeAutoObservable } from 'mobx'

const AudioContext =
  window.AudioContext ||
  ((window as unknown) as { webkitAudioContext: typeof window.AudioContext })
    .webkitAudioContext

// Inspired by https://github.com/chris-rudmin/Recorderjs
// eslint-disable-next-line
const wavEncoder = `
  const BYTES_PER_SAMPLE = 2
  let recorded = []
  let prevWav = new Uint8Array(44)

  function setRecordedBuffer(arrayBuffer) {
    prevWav = new Uint8Array(arrayBuffer)
  }

  function encode(buffer) {
    const length = buffer.length
    const data = new Uint8Array(length * BYTES_PER_SAMPLE)
    for (let i = 0; i < length; i++) {
      const index = i * BYTES_PER_SAMPLE
      let sample = buffer[i]
      if (sample > 1) {
        sample = 1
      } else if (sample < -1) {
        sample = -1
      }
      sample = sample * 32768
      data[index] = sample
      data[index + 1] = sample >> 8
    }
    recorded.push(data)
  }

  function dump(sampleRate) {
    const bufferLength = recorded[0]?.length || 0
    const length = recorded.length * bufferLength
    const total = prevWav.length - 44 + length
    const wav = new Uint8Array(44 + total)
    wav.set(prevWav)

    const view = new DataView(wav.buffer)

    // RIFF identifier 'RIFF'
    view.setUint32(0, 1380533830, false)
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + total, true)
    // RIFF type 'WAVE'
    view.setUint32(8, 1463899717, false)
    // format chunk identifier 'fmt '
    view.setUint32(12, 1718449184, false)
    // format chunk length
    view.setUint32(16, 16, true)
    // sample format (raw)
    view.setUint16(20, 1, true)
    // channel count
    view.setUint16(22, 1, true)
    // sample rate
    view.setUint32(24, sampleRate, true)
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true)
    // block align (channel count * bytes per sample)
    view.setUint16(32, BYTES_PER_SAMPLE, true)
    // bits per sample
    view.setUint16(34, 8 * BYTES_PER_SAMPLE, true)
    // data chunk identifier 'data'
    view.setUint32(36, 1684108385, false)
    // data chunk length
    view.setUint32(40, total, true)

    const recordedLength = recorded.length
    const offset = prevWav.length
    for (let i = 0; i < recordedLength; i++) {
      wav.set(recorded[i], i * bufferLength + offset)
    }

    prevWav = new Uint8Array(wav.length)
    prevWav.set(wav)
    recorded = []

    postMessage(wav.buffer, [wav.buffer])
  }

  onmessage = (e) => {
    const [type, data] = e.data

    if (type === 'encode') {
      encode(data)
    } else if (type === 'dump') {
      dump(data)
    } else if (type === 'clear') {
      recorded = []
      prevWav = new Uint8Array(44)
    } else if (type === 'setRecordedBuffer') {
      setRecordedBuffer(data)
    }
  }
`

export type RecorderState = 'inactive' | 'recording' | 'paused'

export type EventName = 'stateChange' | 'timeChange' | 'audio'

export const isRecordingSupported = navigator.mediaDevices && AudioContext

export const defaultState: RecorderState = 'inactive'

const bufferLength = 2048

export function createAudioRecorder({
  arrayBuffer,
  currentTime = 0,
}: { arrayBuffer?: ArrayBuffer; currentTime?: number } = {}) {
  const encoder = new Worker(URL.createObjectURL(new Blob([wavEncoder])))

  const context = new AudioContext()
  const { sampleRate } = context
  const events = document.createDocumentFragment()
  let stream: MediaStream
  let input: MediaStreamAudioSourceNode
  let processor: ScriptProcessorNode
  let audioRequested = false

  // eslint-disable-next-line
  const dispatch = (name: EventName, data: any) => {
    const event = new Event(name)
    // eslint-disable-next-line
    ;(event as any).data = data
    events.dispatchEvent(event)
  }

  const setState = (
    recorder: { state: RecorderState },
    newState: RecorderState,
  ) => {
    recorder.state = newState
    dispatch('stateChange', newState)
  }

  const setCurrentTime = (recorder: { currentTime: number }, time: number) => {
    recorder.currentTime = time
    dispatch('timeChange', time)
  }

  encoder.onmessage = (e) => {
    dispatch('audio', e.data)
    audioRequested = false
  }

  if (arrayBuffer) encoder.postMessage(['setRecordedBuffer', arrayBuffer])

  function addEventListener(
    name: 'stateChange',
    fn: (e: { data: RecorderState }) => void,
  ): void
  function addEventListener(
    name: 'timeChange',
    fn: (e: { data: number }) => void,
  ): void
  function addEventListener(
    name: 'audio',
    fn: (e: { data: ArrayBuffer }) => void,
  ): void
  // eslint-disable-next-line
  function addEventListener(name: EventName, fn: (e: { data: any }) => void) {
    events.addEventListener(name, (fn as unknown) as EventListener)
  }

  return makeAutoObservable({
    state: defaultState,
    currentTime,
    sampleRate,

    addEventListener,
    removeEventListener(name: EventName, fn: (e: Event) => void) {
      events.removeEventListener(name, fn)
    },

    async start() {
      const prevState = this.state
      setState(this, 'recording')
      if (prevState === 'paused') return

      if (!stream)
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      input = context.createMediaStreamSource(stream)
      processor = context.createScriptProcessor(bufferLength, 1, 1)
      processor.onaudioprocess = (e) => {
        if (this.state === 'recording') {
          const channelData = e.inputBuffer.getChannelData(0)
          setCurrentTime(
            this,
            this.currentTime + channelData.length / sampleRate,
          )
          encoder.postMessage(['encode', channelData])
        }
      }

      input.connect(processor)
      processor.connect(context.destination)
    },

    stop() {
      if (this.state === 'inactive') return

      setState(this, 'inactive')
      stream.getAudioTracks().forEach((track) => track.stop())
      processor.disconnect()
      input.disconnect()
    },

    pause() {
      if (this.state !== 'recording') return

      setState(this, 'paused')
    },

    toggle() {
      if (this.state !== 'recording') this.start()
      else this.pause()
    },

    clearAudioData() {
      encoder.postMessage(['clear'])
      setCurrentTime(this, 0)
    },

    requestAudio() {
      if (audioRequested) return

      audioRequested = true
      encoder.postMessage(['dump', sampleRate])
    },
  })
}
