#!/bin/bash
curl -s -X POST  -H "Content-Type: application/json"  --data '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' "http://localhost:8545" | jq .result.enode
