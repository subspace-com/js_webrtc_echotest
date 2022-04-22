# Echo test JS library

This library should be used with an Echo Server. This will automate the creating of multiple WebRTC connections to the Echo Server and calculate which one is the fastest by using a DataChannel.

## Echo Server

We have an [echo server](https://github.com/subspace-com/subspace_webrtc_echoserver) implementation available but you can use any WebRTC server that echos back the data sent on the DataChannel.\
This server needs to be able to receive an SDP offer on the `/offer` HTTP endpoint and return an SDP answer. It also needs to echo back the information received on the DataChannel.

## Installing and using the lib

### Install

```bash
npm install --save @subspacecom/echo-test
# or
yarn add @subspacecom/echo-test
```

### Basic usage

The basic usage of the lib requires 2 parameters: an array of the RTCConfigs that need to be tested, and the echo test options. Example: `echo(rtcConfigs, options)`.

```typescript
  import { echo } from '@subspacecom/echo-test';

  const rtcConfigs = [
    { iceServers: [{ urls: ['stun:stun.l.google.com:193028'] }] },
    { iceServers: [{ urls: ['stun:global.stun.twilio.com:3478'] }] },
  ]

  const options = {
    signalUrl: 'https://echo-server-url.here/offer',
  }

  echo(rtcConfigs, options)
    .then(console.log)
    .catch(console.error)
```

The output to this call should be similar to this:

```json
{
  "sorted": [
    [
      { "iceServers": [{ "urls": ["stun:stun.l.google.com:193028"] }] },
      {
        "iceGatheringTime": 221,
        "iceConnectionTime": 94,
        "avgRTT": 41.7
      }
    ],
    [
      { "iceServers": [{ "urls": ["stun:global.stun.twilio.com:3478"] }] },
      {
        "iceGatheringTime": 468,
        "iceConnectionTime": 134,
        "avgRTT": 50
      }
    ]
  ],
  "failed": [],
  "totalTime": 1274
}
```

After that it's up to you on how to use it.\
The easy route is to use the first configuration from the `sorted` key. Entries are already sorted from faster to slower by `avgRTT` (average measured RoundTripTie), since latency is one major factor affecting a WebRTC connection's quality.
If you want to, you could change the way the items are sorted accordingly to your own criteria. For example, consider using the historically more stable configuration even when the current estimated latency is slightly worse.

### Options

| Parameter | Type | Required | Default | Description |
| - | - | - | - | - |
| signalUrl | `string` | yes | `undefined` | This is the HTTP endpoint of the echo server, something like `https://your-url.com/offer`. |
| timeout | `number` | no | `2500` ms | This parameter limits the time that the test will run for. Once the limit is reached it will return all the successful tests under `sorted` and all unfinished or failed tests under `failed`. |
| iceTimeout | `number` | no | `1000` ms | This is the total time that the peer will have to connect. This goes from the Peer creation to the ICE gathering and ICE connection completion. |
| dataTimeout | `number` | no | `100` ms | This represents the timeout for each of the requests made over the DataChannel. When it times out the defined value is added to the average calculation. |
| requests | `number` | no | 10 | This is the amount of times data will be sent using the DataChannel before calculating the average. |
| sorter | `function` | no | (a, b) => a.avgRTT - b.avgRTT | This function is used to sort the best configuration using the data exchanged. In addition to the `avgRTT`, the props also have the `iceGatheringTime`, `iceConnectionTime`, and the `rtcConfig` which is the original configuration used to start the test. [See Examples](#sorter-examples). |

#### Sorter examples

Giving the Subspace configuration a 15ms advantage over the other:

```typescript
const isSubspace = (rtcConfig: RTCConfiguration) => {
  return !!rtcConfig.iceServers?.find((iceServer) => iceServer.urls.includes('subspace.com'));
}

const sorter = (a, b) => {
  const aAdvantage = isSubspace(a.rtcConfig) ? 15 : 0;
  const bAdvantage = isSubspace(b.rtcConfig) ? 15 : 0;

  return (a.avgRTT - aAdvantage) - (b.avgRTT - bAdvantage);
}

// Then pass the sorter on the echo configuration.
```

Giving the Subspace configuration a 10% advantage over the other:

```typescript
const isSubspace = (rtcConfig: RTCConfiguration) => {
  return !!rtcConfig.iceServers?.find((iceServer) => iceServer.urls.includes('subspace.com'));
}

const sorter = (a, b) => {
  const aAdvantage = isSubspace(a.rtcConfig) ? (a.avgRTT * 0.1) : 0;
  const bAdvantage = isSubspace(b.rtcConfig) ? (b.avgRTT * 0.1) : 0;

  return (a.avgRTT - aAdvantage) - (b.avgRTT - bAdvantage);
}

// Then pass the sorter on the echo configuration.
```

## Contributing

### Dependencies

Install [yarn](https://classic.yarnpkg.com/lang/en/docs/install). We also recommending using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) with [deeper shell integration](https://github.com/nvm-sh/nvm#deeper-shell-integration).

Install the dependencies by running `yarn`.

### Running it locally

When you're running it locally you're actually running an example app that imports the library.\
It's a good idea to use it to develop and test the lib but the compilation process is different from the publish one.

- Start the build watch with `yarn start`.
- Test it with `yarn test:watch`.
- The pre commit should fix the lint errors automatically, but you can use the `yarn lint:fix` if you want to do it manually.

> Note: When a html or css file is changed you need to restart the server or manually run the `yarn copy` command

### Building and testing

Those commands are meant to be used by the CI/CD and before publishing the lib. You don't need to run any of them manually.

- Build the lib with the `yarn build` command.
- Test it with `yarn test`, it will also run the test coverage and display it by the end of the tests. An lcov report is also exported.
- Check for lint errors with `yarn lint`.

### Publishing

When publishing, the app will be built and tested to avoid errors.
Publish it with `yarn publish --access public`.
