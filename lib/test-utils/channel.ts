export class RTCDataChannelMock {
  responseDelays: number[];

  constructor(responseDelays: number[] = []) {
    this.responseDelays = responseDelays;

    // Give some time for the test to run before opening the channel
    setTimeout(() => this.onopen(), 500);
  }

  onopen = () => {};

  // eslint-disable-next-line no-unused-vars
  onmessage = (event: MessageEvent) => {};

  send = (message: string) => {
    let delay = this.responseDelays.shift();
    if (!delay) delay = Math.round(Math.random() + 10); // Either 10 or 11ms, to create some variation

    setTimeout(() => {
      const event = new MessageEvent('message', {
        data: {
          text: () => Promise.resolve(message),
        },
      });

      this.onmessage(event);
    }, delay);
  };

  close = () => {};
}

export default RTCDataChannelMock;
