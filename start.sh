#!/usr/bin/env bash
#
# ync-jump-spot 원클릭 실행 스크립트
# -----------------------------------
# 1) 의존성 자동 설치 (node_modules / cloudflared)
# 2) 로컬 개발/미리보기 서버 기동
# 3) Cloudflare 퀵 터널 생성 → 다른 네트워크에서 접속 가능한 공개 URL 발급
#
# 사용법:
#   ./start.sh          # 개발 서버(dev, 핫리로드) + Cloudflare 터널
#   ./start.sh prod     # 프로덕션 빌드 후 preview 서버 + Cloudflare 터널
#   ./start.sh local    # 터널 없이 로컬에서만 실행
#
# 종료: Ctrl+C (서버·터널 모두 정리됨)

set -euo pipefail

# ── 경로/설정 ────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

MODE="${1:-dev}"                     # dev | prod | local
LOCAL_BIN="$HOME/.local/bin"
CLOUDFLARED="$LOCAL_BIN/cloudflared"
LOG_DIR="$PROJECT_DIR/.run"
SERVER_LOG="$LOG_DIR/server.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"

case "$MODE" in
  dev)         PORT=5173 ;;
  prod|preview) PORT=4173; MODE=prod ;;
  local)       PORT=5173 ;;
  *) echo "알 수 없는 모드: $MODE  (dev | prod | local 중 선택)"; exit 1 ;;
esac

mkdir -p "$LOG_DIR"

# ── 색상 로그 ────────────────────────────────────────────────
c_g(){ printf '\033[32m%s\033[0m\n' "$*"; }
c_y(){ printf '\033[33m%s\033[0m\n' "$*"; }
c_b(){ printf '\033[36m%s\033[0m\n' "$*"; }
c_r(){ printf '\033[31m%s\033[0m\n' "$*"; }

SERVER_PID=""
TUNNEL_PID=""

cleanup() {
  echo
  c_y "▶ 종료 중… 서버와 터널을 정리합니다."
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  # vite 자식 프로세스까지 정리
  pkill -P "${SERVER_PID:-0}" 2>/dev/null || true
  wait 2>/dev/null || true
  c_g "▶ 정리 완료. 안녕히 가세요 👋"
}
trap cleanup INT TERM EXIT

# ── 1. cloudflared 설치 확인 ─────────────────────────────────
ensure_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    CLOUDFLARED="$(command -v cloudflared)"; return
  fi
  if [ -x "$CLOUDFLARED" ]; then return; fi
  c_y "▶ cloudflared 가 없어 다운로드합니다…"
  mkdir -p "$LOCAL_BIN"
  local arch; arch="$(uname -m)"
  local asset
  case "$arch" in
    x86_64|amd64) asset="cloudflared-linux-amd64" ;;
    aarch64|arm64) asset="cloudflared-linux-arm64" ;;
    *) c_r "지원하지 않는 아키텍처: $arch"; exit 1 ;;
  esac
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/$asset" -o "$CLOUDFLARED"
  chmod +x "$CLOUDFLARED"
  c_g "▶ cloudflared 설치 완료: $($CLOUDFLARED --version)"
}

# ── 2. 의존성 설치 ───────────────────────────────────────────
ensure_deps() {
  if [ ! -d node_modules ]; then
    c_y "▶ node_modules 가 없어 npm install 을 실행합니다…"
    npm install
  fi
}

# ── 3. 서버 기동 ─────────────────────────────────────────────
# 참고: 기본 포트($PORT)가 다른 프로그램에 점유되어 있으면 vite 는
#       자동으로 다음 빈 포트를 사용한다. 아래에서 로그를 파싱해
#       "실제로 사용된 포트"를 감지하여 터널을 정확히 연결한다.
start_server() {
  : > "$SERVER_LOG"
  if [ "$MODE" = "prod" ]; then
    c_y "▶ 프로덕션 빌드 중… (npm run build)"
    npm run build
    c_b "▶ preview 서버 기동 (기본 포트 $PORT)"
    npm run preview -- --host --port "$PORT" >>"$SERVER_LOG" 2>&1 &
  else
    c_b "▶ 개발 서버 기동 (기본 포트 $PORT, 핫리로드)"
    npm run dev -- --host --port "$PORT" >>"$SERVER_LOG" 2>&1 &
  fi
  SERVER_PID=$!
}

# vite 로그의 "Local: http://localhost:PORT/" 에서 실제 포트를 추출
wait_for_server() {
  c_y "▶ 서버가 준비될 때까지 대기…"
  local line=""
  for _ in $(seq 1 90); do
    line="$(grep -Eo 'Local:[[:space:]]+http://localhost:[0-9]+' "$SERVER_LOG" | head -1 || true)"
    if [ -n "$line" ]; then
      PORT="${line##*:}"
      break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      c_r "▶ 서버가 비정상 종료되었습니다. 로그:"; tail -20 "$SERVER_LOG"; exit 1
    fi
    sleep 1
  done
  if [ -z "$line" ]; then
    c_r "▶ 서버 시작 시간 초과. 로그:"; tail -20 "$SERVER_LOG"; exit 1
  fi
  # 실제 포트로 응답 확인
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
      c_g "▶ 로컬 서버 준비 완료 → http://localhost:$PORT"
      LAN_URL="$(grep -Eo 'Network:[[:space:]]+http://[0-9.]+:[0-9]+' "$SERVER_LOG" | head -1 | grep -Eo 'http://[0-9.]+:[0-9]+' || true)"
      return 0
    fi
    sleep 1
  done
  c_r "▶ 서버 응답 없음(포트 $PORT). 로그:"; tail -20 "$SERVER_LOG"; exit 1
}

# ── 4. Cloudflare 퀵 터널 ────────────────────────────────────
start_tunnel() {
  : > "$TUNNEL_LOG"
  c_b "▶ Cloudflare 퀵 터널 생성 중…"
  "$CLOUDFLARED" tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >>"$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!

  local url=""
  for _ in $(seq 1 40); do
    url="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)"
    [ -n "$url" ] && break
    if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
      c_r "▶ 터널이 비정상 종료되었습니다. 로그:"; tail -20 "$TUNNEL_LOG"; exit 1
    fi
    sleep 1
  done

  if [ -z "$url" ]; then
    c_r "▶ 터널 URL 발급 실패. 로그:"; tail -20 "$TUNNEL_LOG"; exit 1
  fi
  PUBLIC_URL="$url"
}

# ── 실행 ─────────────────────────────────────────────────────
c_g "════════════════════════════════════════════════"
c_g "  ync-jump-spot 원클릭 실행  (모드: $MODE)"
c_g "════════════════════════════════════════════════"

ensure_deps
start_server
wait_for_server

if [ "$MODE" = "local" ]; then
  echo
  c_g "════════════════════════════════════════════════"
  c_g "  로컬 실행 완료"
  c_b "  로컬 주소 : http://localhost:$PORT"
  c_y "  LAN 주소  : ${LAN_URL:-http://<이컴퓨터IP>:$PORT}  (같은 공유기 내 접속)"
  c_g "════════════════════════════════════════════════"
  echo "  (종료: Ctrl+C)"
else
  ensure_cloudflared
  start_tunnel
  echo
  c_g "════════════════════════════════════════════════"
  c_g "  🚀 배포 완료! 아래 주소를 공유하세요"
  echo
  c_b "  공개 주소 : $PUBLIC_URL"
  echo "  로컬 주소 : http://localhost:$PORT"
  c_g "════════════════════════════════════════════════"
  c_y "  ※ 퀵 터널 주소는 실행할 때마다 바뀝니다."
  echo "  (종료: Ctrl+C — 서버·터널 모두 정리됩니다)"
fi

echo
c_y "▶ 로그: $SERVER_LOG , $TUNNEL_LOG"
# 프로세스가 살아있는 동안 대기
wait
