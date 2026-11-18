#!/bin/sh
# every suite against PAGE/SERVER (default: the published pair), one line a suite and the full logs in tests/logs/: sh tests/all.sh [prefix]
# SUITES="relay online" picks some; PORT_T is the port of the online ones; the old-server suites need SERVER=<an old server.js> and are not in the list,
# nor are the long ones (soak, transport-battle). The quick ones come first; loadout*, transport, field, world and bases take minutes each
cd "$(dirname "$0")/.." && mkdir -p tests/logs
for t in ${SUITES:-relay crew-relay damage-relay drone-relay forts-relay gen-relay resume-relay heli-relay transport-relay sappers-relay pad ana damage heli heli-arms heli-ai crew infantry squads smoke-sight perception missiles drone woods forts sappers posts city seat loadout loadout-more loadout-stores transport field world bases online crew-online drone-online forts-online sappers-online heli-online world-online bases-online loadout-online transport-online city-online eco-online gen-online resume-online ana-online frame-budget sky-relay sky sky-online}; do
  [ -f tests/$t.js ] || continue
  s=$(date +%s); node tests/$t.js > tests/logs/$1$t.log 2>&1; rc=$?
  echo "$t rc=$rc $(( $(date +%s) - s ))s $(tail -1 tests/logs/$1$t.log)"
done
