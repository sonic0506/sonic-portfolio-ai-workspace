# Shared Skill Catalog — Sample

CONTENT_SPEC의 공통 Skill 목록 검증용 샘플이다. Project / Blog / Profile이 같은 항목을 참조하는지 확인한다.
`id`는 참조 키, `name`은 표시명이다. 아이콘 공급 방식은 미정이다.

| id | name | 사용처 |
|---|---|---|
| react | React | syncmaster, yujin-robot, viora |
| typescript | TypeScript | syncmaster, web-serial-usb |
| nestjs | NestJS | yujin-robot, websocket-binary-video |
| websocket | WebSocket | yujin-robot, websocket-binary-video |
| rtsp | RTSP | yujin-robot, websocket-binary-video |
| ffmpeg | ffmpeg | yujin-robot, websocket-binary-video |
| docker | Docker | yujin-robot |
| web-serial | Web Serial API | syncmaster, web-serial-usb, offline-first-boundary |
| service-worker | Service Worker | syncmaster, offline-first-boundary |
| react-native | React Native | viora |
| java | Java | viora |
| android | Android | viora |
| rtos | RTOS | viora |
| ble | BLE | viora |
| stt | STT | viora |
| llm | LLM | viora |
| tts | TTS | viora |
| egohos | EgoHos | viora |
| mentraos | MentraOS | viora |

## 검증에서 드러난 것

- 프로젝트 front matter는 표시명(`Web Serial API`)을 쓰고 있어 참조 키와 표시명의 분리가 필요하다. 현재 샘플은 이름 문자열로 느슨하게 연결돼 있다.
- `STT` / `LLM` / `TTS`는 기술명이라기보다 파이프라인 단계에 가깝다. Skill로 둘지 별도 개념으로 둘지 결정이 필요하다.
- 태그(`websocket`, `폐쇄망`)와 Skill(`WebSocket`)은 겹치는 이름이 있지만 CONTENT_SPEC대로 자동 동일시하지 않는다.
