/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-array-index-key */
import { useState, useRef } from 'react';
import { echo } from '../lib';

const rtcConfiguration = [
  {
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302'],
      },
    ],
  },
  {
    iceServers: [
      {
        urls: ['stun:stun2.l.google.com:19302'],
      },
    ],
  },
];

const echoTestConfiguration = {
  signalUrl: 'http://localhost:8080/offer',
  timeout: 10000,
  iceTimeout: 2000,
  dataTimeout: 500,
  requests: 10,
};

const App = () => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const rtcConfigurationRef = useRef(null);
  const echoTestConfigurationRef = useRef(null);

  const runTest = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (isRunning) return;

    setIsRunning(true);

    const rtcConfig = JSON.parse(rtcConfigurationRef.current.value) || rtcConfiguration;
    const echoConfig = JSON.parse(echoTestConfigurationRef.current.value) || echoTestConfiguration;

    echo(rtcConfig, echoConfig)
      .then((results) => setTests((t) => [results, ...t]))
      .catch((err) => setTests((t) => [err.message, ...t]))
      .finally(() => setIsRunning(false));
  };

  return (
    <div className="container">
      <form onSubmit={runTest}>
        <label>
          <p>Array of RTCConfiguration</p>
          <textarea ref={rtcConfigurationRef} rows={10} defaultValue={JSON.stringify(rtcConfiguration, null, 2)} />
        </label>
        <label>
          <p>Echo test configuration</p>
          <textarea
            ref={echoTestConfigurationRef}
            rows={7}
            defaultValue={JSON.stringify(echoTestConfiguration, null, 2)}
          />
        </label>
        <button type="submit" disabled={isRunning}>
          Start Test
        </button>
      </form>

      <div>
        {tests.map((test) => {
          if (!test) return <div key={test}>FAIL</div>;
          return <pre key={test}>{JSON.stringify(test, null, 2)}</pre>;
        })}
      </div>
    </div>
  );
};

export default App;
