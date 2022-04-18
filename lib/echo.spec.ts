import RTCPeerConnectionMock from './test-utils/peer-connection';
import echo from './echo';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    failAt: '' | 'offerResponse' | 'sendOffer' | 'setRemoteDescription' | 'createOffer';
  }
}

global.RTCPeerConnection = RTCPeerConnectionMock as any;

window.failAt = '';

const defaultFetch = jest.fn(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          json: () =>
            Promise.resolve({
              type: 'answer',
              sdp: 'sdp',
            }),
        });
        // Fake response time so we're able to test the timeout
      }, 250);
    }),
) as any;

global.fetch = defaultFetch;

describe('echo', () => {
  it('should run a successful test', async () => {
    const numberOfPeersToTest = 20;
    const testRes = await echo(new Array(numberOfPeersToTest).fill({}), { signalUrl: '/offer' });

    expect(testRes.sorted?.length).toBe(numberOfPeersToTest);
    expect(testRes.failed?.length).toBe(0);

    testRes.sorted.forEach(([rtcConfig, stats]) => {
      expect(rtcConfig).toBeDefined();

      // It should 10ms + code execution
      expect(stats.avgRTT).toBeGreaterThan(9);
      expect(stats.avgRTT).toBeLessThan(15);

      // iceGatheringTime takes 50ms + sendOffer time defined by the fetch above + code time
      expect(stats.iceGatheringTime).toBeGreaterThan(299);
      expect(stats.iceGatheringTime).toBeLessThan(315);

      // iceConnectionTime takes 50ms + code time
      expect(stats.iceConnectionTime).toBeGreaterThan(49);
      expect(stats.iceConnectionTime).toBeLessThan(65);
    });

    // The sum of the iceGatheringTime and iceConnectionTime + sendOffer time defined by the fetch above + the ping of 10ms for each request
    expect(testRes.totalTime).toBeGreaterThan(399);
    expect(testRes.totalTime).toBeLessThan(650);
  });

  it('should timeout while creating the peer', async () => {
    const testRes = await echo([{}], { signalUrl: '/offer', iceTimeout: 100 });

    expect(testRes.failed?.length).toBe(1);

    testRes.failed.forEach(([rtcConfig, error]) => {
      expect(rtcConfig).toBeDefined();
      expect(error).toBe('PeerConnection timed out');
    });
  });

  it('should timeout timeout before any tests pass', async () => {
    // It's hard to force this state due to the randomness of the execution time
    const testRes = await echo([{}], { signalUrl: '/offer', timeout: 600, iceTimeout: 599, dataTimeout: 50 });

    expect(testRes.failed?.length).toBe(1);

    testRes.failed.forEach(([rtcConfig, error]) => {
      expect(rtcConfig).toBeDefined();
      expect(error).toBe('Test timed out without the peer responding');
    });
  });

  describe('configuration errors', () => {
    it("should reject when there's no rtcConfigs to test", async () => {
      try {
        await echo([], { signalUrl: '/offer' });
      } catch (err) {
        expect(err).toEqual(new Error('Monitor was called with no peer configurations'));
      }
    });

    it('should reject when called without a signalUrl', async () => {
      try {
        await echo([{}], { signalUrl: '' });
      } catch (err) {
        expect(err).toEqual(new Error('Monitor was called with no signal url'));
      }
    });

    it('should reject when iceTimeout is bigger than overall timeout', async () => {
      try {
        await echo([{}], { signalUrl: '/offer', timeout: 100, iceTimeout: 1000 });
      } catch (err) {
        expect(err).toEqual(new Error('iceTimeout needs to be smaller than overall timeout'));
      }
    });

    it('should reject when dataTimeout is bigger than overall timeout', async () => {
      try {
        await echo([{}], { signalUrl: '/offer', timeout: 100, iceTimeout: 1, dataTimeout: 1000 });
      } catch (err) {
        expect(err).toEqual(new Error('dataTimeout needs to be smaller than overall timeout'));
      }
    });
  });
});
