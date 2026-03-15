import type { LiveSale } from '~/types'

export enum StreamStatus {
    IDLE = 'idle',
    STARTING = 'starting',
    ACCESSING_CAMERA = 'accessing_camera',
    CONNECTING = 'connecting',
    STOPPING = 'stopping',
    LIVE = 'live',
    ERROR = 'error'
}

const closeDialogHandler = (event: Event) => {
    event.preventDefault()

    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true
}

// Prefer H.264 codec by reordering SDP m=video payload types
function preferH264(sdp: string): string {
    const lines = sdp.split('\r\n')

    const videoMLineIndex = lines.findIndex((line) => line.startsWith('m=video'))
    if (videoMLineIndex === -1) return sdp

    const h264PayloadTypes = lines
        .map((line) => line.match(/^a=rtpmap:(\d+)\s+H264\//)?.[1])
        .filter((type): type is string => type !== undefined)

    if (h264PayloadTypes.length === 0) return sdp

    const mLine = lines[videoMLineIndex]
    const parts = mLine!.split(' ')
    const [mediaType, port, protocol, ...payloads] = parts

    const otherPayloadTypes = payloads.filter((pt) => !h264PayloadTypes.includes(pt))

    const reorderedMLine = [
        mediaType,
        port,
        protocol,
        ...h264PayloadTypes,
        ...otherPayloadTypes
    ].join(' ')

    const result = [...lines]
    result[videoMLineIndex] = reorderedMLine
    return result.join('\r\n')
}

export const useWebRTC = () => {
    const config = useRuntimeConfig()
    const toast = useToast()
    const canvasStream = useCanvasStream()

    const isStreaming = ref(false)
    const streamStatus = ref<StreamStatus>(StreamStatus.IDLE)
    const videoRef = ref<HTMLVideoElement | null>(null)
    let pc: RTCPeerConnection | null = null
    let localStream: MediaStream | null = null
    let currentLiveId: number | null = null

    const startLive = async (live: LiveSale) => {
        streamStatus.value = StreamStatus.STARTING

        try {
            window.addEventListener('beforeunload', closeDialogHandler)

            // Get webcam stream
            streamStatus.value = StreamStatus.ACCESSING_CAMERA
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    aspectRatio: 9 / 16
                },
                audio: true
            })
            // Pass webcam through canvas compositor
            const composited = canvasStream.start(localStream)

            if (videoRef.value) {
                videoRef.value.srcObject = composited
            }

            streamStatus.value = StreamStatus.CONNECTING
            currentLiveId = live.id

            pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            })

            // Add composited tracks (canvas video + webcam audio)
            composited.getTracks().forEach((track) => {
                pc!.addTrack(track, composited)
            })

            // Create offer and prefer H.264
            const offer = await pc.createOffer()
            offer.sdp = preferH264(offer.sdp || '')
            await pc.setLocalDescription(offer)

            // Wait for ICE gathering
            await new Promise<void>((resolve) => {
                if (pc?.iceGatheringState === 'complete') {
                    resolve()
                } else {
                    pc!.onicegatheringstatechange = () => {
                        if (pc?.iceGatheringState === 'complete') {
                            resolve()
                        }
                    }
                }
                setTimeout(resolve, 2000)
            })

            // Send SDP to SRS via WHIP
            const srsUrl = (config.public as any).srsUrl || 'http://localhost:1985'
            const whipUrl = `${srsUrl}/rtc/v1/whip/?app=live&stream=${live.id}`

            const whipResponse = await fetch(whipUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: pc.localDescription?.sdp
            })

            if (!whipResponse.ok) {
                throw new Error('SRS WHIP rejected offer: ' + (await whipResponse.text()))
            }

            const answerSdp = await whipResponse.text()
            await pc.setRemoteDescription(
                new RTCSessionDescription({
                    type: 'answer',
                    sdp: answerSdp
                })
            )

            isStreaming.value = true
            streamStatus.value = StreamStatus.LIVE
            toast.add({
                title: 'Success',
                description: 'Stream started successfully',
                color: 'primary'
            })
        } catch (error: any) {
            console.error('Streaming error:', error)
            streamStatus.value = StreamStatus.ERROR
            toast.add({
                title: 'Error',
                description: error.message || 'Failed to start stream',
                color: 'error'
            })
            stopStream()
        }
    }

    const stopStream = async () => {
        window.removeEventListener('beforeunload', closeDialogHandler)

        streamStatus.value = StreamStatus.STOPPING

        if (pc) {
            pc.close()
            pc = null
        }

        // Stop canvas compositor
        canvasStream.stop()

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop())
            localStream = null
        }
        if (videoRef.value) {
            videoRef.value.srcObject = null
        }
        isStreaming.value = false
        currentLiveId = null
        streamStatus.value = StreamStatus.IDLE
    }

    return {
        isStreaming,
        streamStatus,
        videoRef,
        canvasStream,
        startLive,
        stopStream
    }
}
