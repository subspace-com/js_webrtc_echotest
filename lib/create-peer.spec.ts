import RTCPeerConnectionMock from './test-utils/peer-connection';
import createPeer from './create-peer';

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
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (window.failAt === 'sendOffer') reject(new Error('fail'));

        resolve({
          json: () => {
            if (window.failAt === 'offerResponse') return Promise.resolve(null);
            return Promise.resolve({
              type: 'answer',
              sdp: 'sdp',
            });
          },
        });
        // Fake response time so we're able to test the timeout
      }, 500);
    }),
) as any;

global.fetch = defaultFetch;

describe('create-peer', () => {
  it('should stablish a connection', async () => {
    const peer = await createPeer({}, 1000, '/offer');

    expect(peer).toBeDefined();

    // iceGatheringTime takes 50ms + sendOffer time defined by the fetch above
    expect(peer.iceGatheringTime).toBeGreaterThan(549);
    expect(peer.iceGatheringTime).toBeLessThan(600);

    // iceConnectionTime of 50ms + code execution time
    expect(peer.iceConnectionTime).toBeGreaterThan(49);
    expect(peer.iceConnectionTime).toBeLessThan(60);
  });

  it('should timeout', async () => {
    try {
      await createPeer({}, 10, '/offer');
    } catch (err) {
      expect(err).toEqual(new Error('PeerConnection timed out'));
    }
  });

  it('should fail to createOffer', async () => {
    window.failAt = 'createOffer';

    try {
      await createPeer({}, 1000, '/offer');
    } catch (err) {
      expect(err).toEqual(new Error('Failed to create an offer'));
    }

    window.failAt = '';
  });

  it('should fail to setRemoteDescription', async () => {
    window.failAt = 'setRemoteDescription';

    try {
      await createPeer({}, 1000, '/offer');
    } catch (err) {
      expect(err).toEqual(new Error('Failed to set remote description'));
    }

    window.failAt = '';
  });

  describe('fetch offer', () => {
    it('should fail to sendOffer', async () => {
      window.failAt = 'sendOffer';

      try {
        await createPeer({}, 1000, '/offer');
      } catch (err) {
        expect(err).toEqual(new Error('Failed to send offer'));
      }

      window.failAt = '';
    });

    it('should receive empty response', async () => {
      window.failAt = 'offerResponse';

      try {
        await createPeer({}, 1000, '/offer');
      } catch (err) {
        expect(err).toEqual(new Error('Offer returned with no response'));
      }

      window.failAt = '';
    });
  });
});
