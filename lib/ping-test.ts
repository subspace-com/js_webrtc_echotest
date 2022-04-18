import { PeerWithStats } from './types';

export const getAverage = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;

export const getMessage = async (event: MessageEvent): Promise<string> => {
  if (event.data instanceof ArrayBuffer) {
    return new TextDecoder().decode(event.data);
  }

  const message = await event.data.text();
  return message;
};

const pingTest = (peer: PeerWithStats, requests: number, timeout: number): Promise<PeerWithStats> =>
  new Promise((resolve) => {
    const { channel } = peer;
    const pings: number[] = [];
    let curMessage: number = 0;
    let curTimeoutRef = setTimeout(() => {}, 0);

    channel.onopen = () => {
      const sendNextMessage = () => {
        if (pings.length >= requests) {
          resolve({ ...peer, avgRTT: getAverage(pings) });
          return;
        }

        curMessage = performance.now();

        curTimeoutRef = setTimeout(() => {
          pings.push(timeout);
          sendNextMessage();
        }, timeout);

        channel.send(curMessage.toString());
      };

      channel.onmessage = async (event: MessageEvent) => {
        const message = await getMessage(event);

        if (message === curMessage.toString()) {
          pings.push(performance.now() - curMessage);
          clearTimeout(curTimeoutRef);
          sendNextMessage();
        }
      };

      sendNextMessage();
    };
  });

export default pingTest;
