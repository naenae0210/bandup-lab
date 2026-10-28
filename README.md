# BandUp Lab

2026년 개편 TOEFL iBT를 준비하는 개인용 학습 도구다. ETS와 무관한 개인 학습 도구다.

## 실행 방법

```bash
cp .env.example .env   # 값을 채운다
docker compose up --build
```

브라우저에서 http://localhost:5173 접속.

## 서비스

| 서비스 | 기본 포트 | 역할 |
| --- | --- | --- |
| web | 5173 | React 화면 (nginx) |
| api | 8000 | FastAPI 서버 (`/health`) |
| stt | 8001 | 받아쓰기 서비스 (`/health`) |
| db | 5432 | PostgreSQL |

## 개발

```bash
cd backend && pip install -e ".[dev]" && pytest
cd web && npm install && npm run dev
```
