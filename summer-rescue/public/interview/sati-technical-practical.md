# Practical drill — diagnose a stopped service

Time box: 45 minutes. Use a terminal you are comfortable with. The Python path requires no container image download.

## Option A: local Python HTTP service

Open a folder containing a harmless text file.

### 1. Healthy baseline

Run:

```bash
python -m http.server 8000
```

In another terminal, collect evidence:

```bash
curl -v http://127.0.0.1:8000/
```

On Linux, also inspect the listener:

```bash
ss -lntp
```

Record:

- expected process/service;
- expected port;
- successful request;
- what each check proves.

### 2. Controlled failure

Stop the server with `Ctrl+C`. Repeat the same `curl` request and preserve the failure message.

Ask:

- Does the host still work?
- Does DNS matter when using `127.0.0.1`?
- Is anything listening on port 8000?
- What changed immediately before the failure?

### 3. Recovery

Start the service again. Repeat the **same** request and listener check. Recovery is not proven until the original symptom has gone.

## Option B: Docker, only if already available

Use an existing safe image or service in your environment. Do not spend interview-prep time downloading or repairing Docker.

Evidence order:

```bash
docker ps -a
docker logs CONTAINER
docker inspect CONTAINER
```

Check state, exit code, port mapping, mounts, environment, and dependencies. After an approved restart/recreate, repeat the original request.

## 90-second explanation

Use:

1. symptom and impact;
2. scope;
3. baseline or failed evidence;
4. cause supported by evidence;
5. safe action;
6. original-path verification;
7. what you would document or escalate.

Avoid claiming that a restart identified the root cause. It may restore service while leaving the cause unknown.
