## SvelteBB

bulletin board system: a computer that is running software
that allows users to leave messages and access information of general interest

## Develop / Deploy 

```bash
pnpm i
pnpm push:db
# dev
pnpm dev --port 4001
# deploy (reverse proxy needed)
pnpm run build && killall -9 node ; HOST=127.0.0.1 PORT=4001 node build
```

