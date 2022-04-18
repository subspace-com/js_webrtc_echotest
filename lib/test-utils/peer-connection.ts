/* eslint-disable class-methods-use-this */
import RTCDataChannelMock from './channel';

export class RTCPeerConnectionMock {
  private configuration: RTCConfiguration;

  constructor(configuration: RTCConfiguration) {
    this.configuration = configuration;
  }

  public iceGatheringState = 'new';

  public iceConnectionState = 'new';

  createDataChannel() {
    return new RTCDataChannelMock();
  }

  createOffer(): Promise<any> {
    if (window.failAt === 'createOffer') return Promise.reject();
    return Promise.resolve({
      type: 'offer',
      sdp: 'sdp',
    });
  }

  close() {}

  setLocalDescription() {
    setTimeout(() => {
      this.iceGatheringState = 'complete';
      this.onicegatheringstatechange();
    }, 50);
  }

  setRemoteDescription() {
    if (window.failAt === 'setRemoteDescription') return Promise.reject();

    setTimeout(() => {
      this.iceConnectionState = 'connected';
      this.oniceconnectionstatechange();
    }, 50);

    return Promise.resolve();
  }

  onicegatheringstatechange() {}

  oniceconnectionstatechange() {}
}

export default RTCPeerConnectionMock;
