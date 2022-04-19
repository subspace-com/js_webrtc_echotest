export type RTCSessionDescriptionInit = {
  type: 'offer' | 'answer';
  sdp: string;
};

export type Stats = {
  iceGatheringTime: number;
  iceConnectionTime: number;
  avgRTT: number;
};

export type PeerWithStats = {
  peer: RTCPeerConnection;
  rtcConfig: RTCConfiguration;
  iceGatheringTime: number;
  iceConnectionTime: number;
  avgRTT: number;
  channel: RTCDataChannel;
};

export type EchoConfig = {
  signalUrl: string;
  timeout?: number;
  iceTimeout?: number;
  dataTimeout?: number;
  requests?: number;
  // eslint-disable-next-line no-unused-vars
  sorter?: (a: PeerWithStats, b: PeerWithStats) => number;
};

export type EchoResponse = {
  sorted: [RTCConfiguration, Stats][];
  failed: [RTCConfiguration, string][];
  totalTime: number;
};
