import asyncio
import logging

from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from stream_processor import AIStreamTrack

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="AI Video Processing Service",
    description="Real-time AI video processing with MediaPipe",
    version="2.0.0",
)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pcs = set()
relay = MediaRelay()

# Available processing modes
AVAILABLE_MODES = [
    "none",
    "blur",
    "face-detection",
    "pose-estimation",
    "edge-detection",
    "face-mesh",
    "avatar",
    "hands",
    "beauty",
    "cartoon",
]

AVATAR_TYPES = ["cartoon", "robot", "mask", "neon"]


@app.on_event("shutdown")
async def on_shutdown():
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


@app.get("/modes")
def get_available_modes():
    """Get list of available AI processing modes"""
    return {
        "modes": AVAILABLE_MODES,
        "avatar_types": AVATAR_TYPES,
        "description": {
            "none": "No processing",
            "blur": "Background blur using selfie segmentation",
            "face-detection": "Detect and highlight faces",
            "pose-estimation": "Full body pose detection",
            "edge-detection": "Artistic edge detection effect",
            "face-mesh": "468-point face mesh visualization",
            "avatar": "AI avatar overlays (cartoon, robot, mask, neon)",
            "hands": "Hand tracking and gesture detection",
            "beauty": "AI beauty filter with skin smoothing",
            "cartoon": "Cartoon/comic book style effect",
        },
    }


@app.post("/offer")
async def offer(request: Request):
    params = await request.json()
    offer_sdp = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    mode = params.get("mode", "none")
    avatar_type = params.get("avatar_type", "cartoon")

    # Validate mode
    if mode not in AVAILABLE_MODES:
        mode = "none"
    if avatar_type not in AVATAR_TYPES:
        avatar_type = "cartoon"

    pc = RTCPeerConnection()
    pcs.add(pc)

    logger.info(
        f"Created for {request.client.host} with mode={mode}, avatar_type={avatar_type}"
    )

    # Store the AI track to be added when we receive the remote track
    ai_track_holder = {"track": None}

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logger.info(f"Connection state is {pc.connectionState}")
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)
        elif pc.connectionState == "closed":
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        logger.info(f"Track {track.kind} received")
        if track.kind == "video":
            # Apply AI processing with avatar type
            local_video = AIStreamTrack(
                relay.subscribe(track),
                mode=mode,
                avatar_type=avatar_type,
            )
            ai_track_holder["track"] = local_video
            logger.info(f"AI track created for mode={mode}")

    # Handle offer - this will trigger on_track for incoming tracks
    await pc.setRemoteDescription(offer_sdp)

    # Now add our AI processed track to the peer connection
    # We need to wait a bit for the track event to fire
    import asyncio

    await asyncio.sleep(0.1)  # Small delay to ensure track event fires

    if ai_track_holder["track"]:
        pc.addTrack(ai_track_holder["track"])
        logger.info("AI track added to peer connection")
    else:
        logger.warning("No AI track was created - no video track received from client")

    # Create answer after adding our track
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    logger.info(f"Sending answer with {len(pc.getTransceivers())} transceivers")

    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "2.0.0",
        "features": ["face-mesh", "avatar", "beauty", "cartoon", "hands"],
    }


@app.get("/stats")
def get_stats():
    """Get service statistics"""
    return {
        "active_connections": len(pcs),
        "available_modes": AVAILABLE_MODES,
    }
