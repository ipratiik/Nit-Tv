class PeerService {
    constructor() {
        if (!this.webRTCPeer) {
            this.webRTCPeer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:global.stun.twilio.com:3478",
                        ],
                    },
                ],
            });
        }
    }

    async getOffer() {
        if (this.webRTCPeer) {
            const offer = await this.webRTCPeer.createOffer();
            // * :: local description refers to the connection information (including media codecs, network data, and other session-related parameters) that the local peer (your device or browser) is proposing to the remote peer (the other device or browser).
            await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }
    }

    async getAnswer(offer) {
        //* The remote description in WebRTC refers to the session parameters (such as media streams, codecs, and network configurations) that are received from the remote peer (the other participant in the communication).
        if (this.webRTCPeer) {
            await this.webRTCPeer.setRemoteDescription(offer);
            const ans = await this.webRTCPeer.createAnswer();
            await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(ans));
            return ans;
        }
    }
    // C:\Users\user\Desktop\Practice Project\webrtc\TestFrontend
    async setLocalDescription(ans) {
        if (this.webRTCPeer) {
            await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(ans));
        }
    }
    async setRemoteDescription(ans) {
        if (this.webRTCPeer) {
            await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(ans));
        }
    }
}

export default PeerService;
