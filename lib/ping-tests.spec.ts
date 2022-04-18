import RTCDataChannelMock from './test-utils/channel';
import pingTest, { getAverage, getMessage } from './ping-test';

const pingTestConfig = {
  peer: {} as RTCPeerConnection,
  rtcConfig: {},
  iceConnectionTime: 0,
  iceGatheringTime: 0,
  avgRTT: 0,
};

describe('ping-test', () => {
  it('should return the averageRTT for 15ms response delay', async () => {
    const channel = new RTCDataChannelMock([15, 15, 15, 15, 15]);
    const result = await pingTest({ ...pingTestConfig, channel: channel as any }, 5, 100);

    // There's a delay added by the code execution, there's no way to verify it but to check if it's withing an expected range
    // So I'm adding a 5ms error margin
    expect(result.avgRTT).toBeGreaterThan(10);
    expect(result.avgRTT).toBeLessThan(20);
  });

  it('should return the exact timeout average', async () => {
    const channel = new RTCDataChannelMock([1000, 1000, 1000, 1000, 1000]);
    const result = await pingTest({ ...pingTestConfig, channel: channel as any }, 5, 50);

    // When it timeouts the value of the timeout will be added to the average instead of the `performance.now() diff`
    expect(result.avgRTT).toBe(50);
  });

  it('should return the average when the jitter is high', async () => {
    const channel = new RTCDataChannelMock([10, 10, 1000, 1000]);
    const result = await pingTest({ ...pingTestConfig, channel: channel as any }, 4, 100);

    // There's a delay added by the code execution, there's no way to verify it but to check if it's withing an expected range
    // So I'm adding a 5ms error margin
    expect(result.avgRTT).toBeGreaterThan(50);
    expect(result.avgRTT).toBeLessThan(60);
  });

  describe('getAverage', () => {
    it('should return average', () => {
      expect(getAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(getAverage([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(5.5);
      expect(getAverage([20, 20, 10, 10])).toBe(15);
    });
  });

  describe('getMessage', () => {
    it('should handle an Array Buffer', async () => {
      const data = new TextEncoder().encode('this is a test').buffer;

      expect(await getMessage({ data } as MessageEvent)).toBe('this is a test');
    });

    it('should handle a blob', async () => {
      // JSDom Blob behaves differently from the browser Blob, so we're using a mock implementation
      const data = {
        text: () => Promise.resolve('this is a test'),
      };

      expect(await getMessage({ data } as MessageEvent)).toBe('this is a test');
    });
  });
});
