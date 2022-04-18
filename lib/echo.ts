import { PeerWithStats, EchoConfig, EchoResponse, Stats } from './types';
import createPeer from './create-peer';
import pingTest from './ping-test';

export const echo = (rtcConfigs: RTCConfiguration[], config: EchoConfig): Promise<EchoResponse> =>
  new Promise((resolve, reject) => {
    const initialTime = performance.now();
    const { signalUrl, timeout = 2500, iceTimeout = 1000, dataTimeout = 100, requests = 10 } = config || {};

    if (rtcConfigs.length === 0) reject(new Error('Monitor was called with no peer configurations'));
    if (!signalUrl) reject(new Error('Monitor was called with no signal url'));
    if (timeout <= iceTimeout) reject(new Error('iceTimeout needs to be smaller than overall timeout'));
    if (timeout <= dataTimeout) reject(new Error('dataTimeout needs to be smaller than overall timeout'));

    let openPeers: PeerWithStats[] = [];
    let passedPeers: PeerWithStats[] = [];
    let failedPeers: [RTCConfiguration, string][] = [];

    // Closing created peers and channels
    const closePeers = (): void => {
      openPeers.forEach((peer) => {
        peer.channel.close();
        peer.peer.close();
      });
    };

    const sendResults = () => {
      const sorted = passedPeers
        .sort((a, b) => {
          if (Math.round(a.avgRTT) === Math.round(b.avgRTT)) {
            return a.iceGatheringTime + a.iceConnectionTime - (b.iceGatheringTime + b.iceConnectionTime);
          }

          return a.avgRTT - b.avgRTT;
        })
        .reduce((acc, cur) => {
          acc.push([
            cur.rtcConfig,
            {
              iceGatheringTime: Math.round(cur.iceGatheringTime),
              iceConnectionTime: Math.round(cur.iceConnectionTime),
              avgRTT: Math.round(cur.avgRTT),
            },
          ]);
          return acc;
        }, [] as [RTCConfiguration, Stats][]);

      resolve({ sorted, failed: failedPeers, totalTime: Math.round(performance.now() - initialTime) });

      // Cleanup
      openPeers = [];
      passedPeers = [];
      failedPeers = [];
    };

    const timeoutRef = setTimeout(() => {
      rtcConfigs
        .filter(
          (rtcConfig) =>
            !passedPeers.find((peer) => peer.rtcConfig !== rtcConfig) &&
            !failedPeers.find((item) => item[0] !== rtcConfig),
        )
        .forEach((item) => failedPeers.push([item, 'Test timed out without the peer responding']));

      sendResults();
    }, timeout);

    const all = rtcConfigs.map((peerConfig) =>
      createPeer(peerConfig, iceTimeout, signalUrl)
        .then((peerWithStats: PeerWithStats) => {
          openPeers.push(peerWithStats);
          return pingTest(peerWithStats, requests, dataTimeout);
        })
        .then((peerWithStats: any) => {
          passedPeers.push(peerWithStats);
          return peerWithStats;
        })
        .catch((err) => {
          failedPeers.push([peerConfig, err.message]);
        }),
    );

    Promise.all(all).finally(() => {
      closePeers();
      clearTimeout(timeoutRef);
      sendResults();
    });
  });

export default echo;
