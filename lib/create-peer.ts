import { RTCSessionDescriptionInit, PeerWithStats } from './types';

export const sendOffer = (signalUrl: string, offer: unknown): Promise<unknown> =>
  fetch(signalUrl, {
    method: 'POST',
    mode: 'cors',
    headers: new Headers({
      'Content-Type': 'application/json; charset=UTF-8',
    }),
    body: JSON.stringify(offer),
  }).then((response) => response.json());

const createPeer = (rtcConfig: RTCConfiguration, iceTimeout: number, signalUrl: string): Promise<PeerWithStats> =>
  new Promise((resolve, reject) => {
    let peer = new RTCPeerConnection(rtcConfig);
    const initialTime = performance.now();
    let iceGatheringTime = 0;

    let channel = peer.createDataChannel('echo-test');

    const rejectWithError = (message: string) => {
      channel?.close();
      channel = null as any;

      peer?.close();
      peer = null as any;

      reject(new Error(message));
    };

    const timeoutRef = setTimeout(() => {
      rejectWithError('PeerConnection timed out');
    }, iceTimeout);

    peer.onicegatheringstatechange = () => {
      if (peer?.iceGatheringState === 'complete') {
        sendOffer(signalUrl, peer.localDescription)
          .then((res) => {
            if (!res) rejectWithError('Offer returned with no response');

            peer.setRemoteDescription(res as RTCSessionDescriptionInit).catch(() => {
              rejectWithError(`Failed to set remote description`);
            });

            iceGatheringTime = performance.now() - initialTime;
          })
          .catch(() => {
            rejectWithError(`Failed to send offer`);
          });
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer?.iceConnectionState === 'connected') {
        clearTimeout(timeoutRef);

        resolve({
          peer,
          rtcConfig,
          iceGatheringTime,
          iceConnectionTime: performance.now() - initialTime - iceGatheringTime,
          avgRTT: 0,
          channel,
        });
      }
    };

    peer
      .createOffer()
      .then((offer) => {
        peer.setLocalDescription(offer);
      })
      .catch(() => {
        rejectWithError(`Failed to create an offer`);
      });
  });

export default createPeer;
