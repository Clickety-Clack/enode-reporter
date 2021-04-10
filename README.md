# enode-reporter

## Requirements

* `curl` and `jq` to execute the Bash scripts.
* Nethermind running locally and accessible on `localhost:8545`
* `eth-netstats` server running somewhere, it's secret and websockets URL
* `config.cfg` file locally with `EthStats` section as such:

```
  "EthStats": {
      "Secret": "eth-netstats websockets secret here",
      "Name": "node name used for deduplication of enodes",
      "Server": "eth-netstats websockets url"
  }

```

This file can be the same that is supplied to the Nethermind client. We only read the `EthStats` element.

## Install

```
npm install
```

## Run

```
npm start
```
