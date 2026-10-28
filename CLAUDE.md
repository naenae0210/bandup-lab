# BandUp Lab

2026년 개편 TOEFL iBT(1~6 밴드)를 준비하는 개인용 웹 서비스다. 모의 사이트에서 푼 문제를 크롬 확장으로 가져오고, AI가 오답 분석·라이팅 첨삭·스피킹 피드백을 한 뒤 오답노트·단어장·밴드 기록에 자동으로 쌓는다. 각자 자기 컴퓨터에서 `docker compose up`으로 띄워 쓰고, 친구에게 무료로 배포할 수 있게 만든다.

## 먼저 읽을 문서

- `docs/plan.md`: 기획서. 기능 명세, AI 연동 방식, 데이터, 기술 스택, 폴더 구조, MVP 범위의 기준이다
- `docs/screens/`: 화면 7개의 정적 디자인 (`index.html`에서 목록). 레이아웃, 문구, 색을 따른다. 화면 속 점수·기록은 예시 데이터다
- `docs/study-plan-prompts.md`: 프롬프트 세트와 11·12월 플랜. `prompts.py`와 홈 화면 플랜 데이터의 원본이다

기획서와 화면이 다르면 기획서를 따르고, 차이를 알려 준다.

## 기술 스택 (확정)

| 영역 | 선택 |
| --- | --- |
| web | React + Vite + TypeScript + Tailwind, nginx로 서빙 |
| api | Python 3.12+, FastAPI, SQLAlchemy 2.0, pydantic-settings |
| db | PostgreSQL (Docker 볼륨) |
| stt | faster-whisper를 감싼 작은 FastAPI 서비스 |
| llm | 공식 SDK `anthropic`, `openai` (비동기 클라이언트) |
| extension | 크롬 확장 Manifest V3 |
| 실행 | Docker Compose: web, api, db, stt |

## 폴더 구조

```
bandup-lab/
├── CLAUDE.md
├── README.md                 # 친구용 설치 안내 (짧게)
├── docker-compose.yml
├── .env.example
├── docs/
├── backend/                  # api 서버
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── src/banduplab/
│   │   ├── __init__.py
│   │   ├── __main__.py       # banduplab-api 명령 진입점
│   │   ├── main.py           # FastAPI 인스턴스 생성, 라우터 등록
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py       # API 키 암호화·마스킹
│   │   ├── prompts.py
│   │   ├── llm/              # base.py(LLMClient), anthropic_client.py, openai_client.py, factory.py
│   │   ├── services/
│   │   └── routers/          # settings, imports, analysis, writing, speaking, records
│   └── tests/
├── stt/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── src/banduplab_stt/
├── web/
└── extension/
```

## Python 규칙

Python Packaging User Guide를 따른다.

- src 레이아웃: 코드는 `src/<패키지>/` 안에 둔다. 개발할 때는 `pip install -e ".[dev]"`로 편집 가능 설치를 한 뒤 실행·테스트한다
- `pyproject.toml`: `[build-system]`(hatchling)과 `[project]`(name, version, requires-python, dependencies)를 둔다. 개발 도구는 `[project.optional-dependencies]`의 `dev`, 실행 명령은 `[project.scripts]`
- 패키지 이름: api는 `banduplab-api` / import는 `banduplab`, stt는 `banduplab-stt` / import는 `banduplab_stt`
- 타입 힌트를 쓰고, SQLAlchemy는 2.0 스타일(`Mapped`, `mapped_column`)로 쓴다

### 계층

| 계층 | 하는 일 | 의존해도 되는 것 |
| --- | --- | --- |
| routers | HTTP 입출력, 입력 검증 | services, schemas |
| services | 학습 로직: 프롬프트 만들기, AI 호출, 결과를 오답노트·단어장·기록에 저장 | llm, prompts, models |
| llm | 공급자 SDK를 같은 `LLMClient` 인터페이스로 감싸기 | 공급자 SDK만 |
| models, db | 테이블과 세션 | SQLAlchemy만 |

- services는 `LLMClient`만 본다. Claude와 OpenAI의 차이는 `llm/` 안에서 끝낸다
- 공급자 SDK의 예외는 `llm/`에서 `LLMError` 하나로 바꾼다 (키 오류, 한도 초과, 연결 실패를 사용자 메시지로)
- 테스트는 가짜 `LLMClient`를 주입해서 API 키 없이 돌린다. 실제 API를 부르는 테스트는 만들지 않는다
- 기본 모델 값은 설정에서 바꿀 수 있게 하고, 모델 목록은 하드코딩하지 않는다

### AI 응답 형식

결과를 자동 저장하려고 AI는 항상 JSON 객체 하나로 답하게 한다. 프롬프트에 스키마를 넣고, 응답에서 JSON을 꺼내는 파서는 코드 블록이나 앞뒤 설명이 붙어도 처리한다. 이어서 질문(채팅)만 일반 문장으로 답한다.

- 리딩·리스닝: `summary`, `items[]`(question, error_type, explanation, evidence, skills), `vocab[]`
- 라이팅: `band`, `band_reason`, `errors[]`(original, corrected, reason), `logic[]`, `model_answer`, `vocab[]`, `skills[]`
- 스피킹: `scores`(fluency, grammar, organization), `band`, `fillers`, `weakest_point`, `errors[]`, `improved_answer`, `skills[]`

`skills`는 관련 문법·독해 스킬 이름 목록이다. 지금은 저장만 하고, 나중에 스킬 그래프(Apache AGE)를 붙일 때 쓴다.

## 지켜야 할 원칙

- 모든 서비스는 localhost에만 연다. 밖으로 나가는 요청은 AI 공급자 호출뿐이다
- API 키는 `APP_SECRET`으로 암호화해 DB에 저장하고, 응답·로그에는 마스킹한 값만 쓴다. 배포물에 키를 넣지 않는다
- 서버가 모의 사이트를 크롤링하지 않는다. 사용자가 보고 있는 화면만 확장이 가져온다
- 가져온 문제 원문은 그 사용자의 DB에만 둔다. 사용자끼리 문제를 공유하거나 모으는 기능은 만들지 않는다
- TOEFL은 ETS 상표다. 서비스 이름·로고에 쓰지 않고, README에 "ETS와 무관한 개인 학습 도구"라고 적는다
- 화면 문구는 한국어, 시험 문제·모범답안은 영어
- 접근성: 실제 `button`, `a`, `label`을 쓰고, 터치 영역은 44px 이상

## 개발 순서

한 단계씩 진행한다. 각 단계는 별도 브랜치(`step-1-compose` 같은 이름)에서 작업하고, 완료 기준을 확인한 뒤 다음 단계로 넘어간다. 단계가 끝나면 무엇을 확인했는지 짧게 보고한다.

1. **Docker Compose 뼈대**
   - web(빈 React 앱), api(`/health`), db, stt(`/health`)가 `docker compose up`으로 함께 뜬다
   - `.env.example`(APP_SECRET, DB 비밀번호, 포트), `.gitignore`, 짧은 README
   - 완료 기준: 네 컨테이너가 모두 healthy, 웹에서 api `/health` 호출 성공
2. **설정 + AI 연결**
   - AI 공급자·모델·API 키 저장(암호화), 연결 테스트, 이번 달 사용량, 시험일·하루 공부 시간
   - 화면: `docs/screens/settings.html`
   - 완료 기준: 키 저장 후 연결 테스트 성공·실패 메시지가 화면에 뜨고, DB에 키가 평문으로 없다
3. **레이아웃 + 홈**
   - 사이드바, 반응형 3단 레이아웃, 홈(D-day, 오늘의 체크리스트, 영역별 밴드, 주차별 포커스)
   - 플랜 데이터는 `docs/study-plan-prompts.md`의 11·12월 배분을 시드로 넣는다
   - 화면: `docs/screens/home.html`
4. **크롬 확장 + 가져오기 API**
   - 팝업: 감지된 과제 유형, 가져올 항목, "이 화면 가져오기". 페이지 텍스트·선택된 답·스크린샷을 api로 보낸다
   - 첫 사이트 1곳은 전용 규칙(파서), 나머지는 전체 텍스트 + 스크린샷
   - 화면: `docs/screens/extension.html`
   - 완료 기준: 개발자 모드로 설치한 확장으로 실제 모의 사이트 한 세트를 가져와 DB에 저장된다
5. **리딩·리스닝**
   - 가져온 문제함, 정답 체크, AI 분석(오답 유형·근거·단어 자동 저장), 이어서 질문
   - 화면: `docs/screens/reading.html`
6. **라이팅**
   - 과제 유형별 문제 생성, 타이머·단어 수 에디터, AI 첨삭, 모범답안 가리고 재작성, 비교 피드백
   - 화면: `docs/screens/writing.html`
7. **스피킹**
   - 질문 읽어주기(브라우저 음성 합성), 녹음(MediaRecorder), stt 받아쓰기(필러 유지), AI 피드백
   - 화면: `docs/screens/speaking.html`
8. **기록**
   - 오답노트·단어장 목록과 검색, 영역별 밴드 추이, 녹음 보관함
   - 화면: `docs/screens/records.html`

MVP 이후(2차: 키 없는 사용자용 프롬프트 전달, 사이트 규칙 추가, 주간 리포트 / 3차 이후: 코치 에이전트, MCP 서버, RAG, LangGraph)는 `docs/plan.md`의 로드맵을 본다. 요청이 없으면 만들지 않는다.

## 자주 쓰는 명령

```bash
docker compose up --build          # 전체 실행
docker compose logs -f api         # api 로그
cd backend && pip install -e ".[dev]" && pytest
cd web && npm install && npm run dev
```

명령이 바뀌면 이 섹션과 README를 같이 고친다.
