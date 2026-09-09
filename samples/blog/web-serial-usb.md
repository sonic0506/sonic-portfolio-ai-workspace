---
type: blog
id: web-serial-usb
title: 브라우저에서 USB 기기와 직접 통신하기 — Web Serial API와 바이너리 변환 계층
created_at: 2025-03-05
updated_at: 2025-03-05
published: true
sample: true
sample_note: AI가 작성한 샘플 초안. 실제 발행 전 본인 문체와 사실 확인 필요.
categories: [웹 API, 프론트엔드]
tags: [web-serial, typescript, 바이너리, 하드웨어]
skills: [Web Serial API, TypeScript, React]
related_projects: [syncmaster]
related_blogs: [offline-first-boundary]
---

## 프론트엔드가 JSON을 못 받을 때

프론트엔드 개발은 대개 이미 정제된 데이터에서 시작합니다. 백엔드가 JSON을 주고, 우리는 그걸 화면에 바인딩합니다. 타입은 `interface`로 선언하고, 값이 이상하면 서버 탓을 할 수 있습니다.

USB로 연결된 모뎀의 설정값을 다루는 도구를 만들면서 그 전제가 사라졌습니다. 데이터의 출처가 HTTP API가 아니라 시리얼 포트로 연결된 물리 장치였고, 오가는 건 전부 바이트였습니다.

:::questions
- Web Serial API는 어떤 환경에서 쓸 수 있나요?
- 바이너리 데이터를 UI에 어떻게 연결했나요?
:::

## Web Serial API

브라우저에서 시리얼 포트를 직접 여는 표준 API입니다. 사용자가 명시적으로 포트를 선택해야 열리고, HTTPS(또는 localhost)에서만 동작합니다. 사용자의 동작 없이 임의의 기기에 붙을 수는 없다는 뜻입니다.

읽기와 쓰기는 스트림입니다.

```ts
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 115200 });

const reader = port.readable.getReader();
const { value } = await reader.read(); // Uint8Array
reader.releaseLock();
```

여기서부터가 실제 일입니다. `Uint8Array`가 손에 들어왔을 뿐, 이게 무슨 의미인지는 아무도 알려주지 않습니다.

## 진짜 난이도는 프로토콜이 아니라 모델 수

시리얼 통신 자체는 어렵지 않습니다. 어려운 건 **모뎀 모델마다 설정 항목과 바이너리 구조가 다르다**는 점이고, 그 모델이 앞으로도 계속 늘어난다는 점입니다.

가장 위험한 형태는 이겁니다.

```ts
// 이렇게 시작하면 모델이 늘 때마다 UI가 오염된다
if (model === 'A100') {
  value = bytes[3] * 256 + bytes[4];
} else if (model === 'B200') {
  value = new DataView(buf).getUint16(2, true);
}
```

한두 개일 땐 멀쩡해 보이지만, 이 분기는 화면 코드 안에 퍼집니다. 모델 하나가 추가될 때마다 UI 파일을 열어야 하는 구조가 되고, 그때부터 신규 모델 대응 비용이 선형으로 늘어납니다.

## 변환 계층을 UI 밖으로

설정 항목을 `{ type, value }` 형태의 태그드 유니온으로 정규화하고, 바이트 ↔ 값 변환을 단일 진입점에서 타입별로 분기하게 했습니다.

```ts
type Setting =
  | { type: 'uint16'; value: number }
  | { type: 'bool'; value: boolean }
  | { type: 'ascii'; value: string };

function decode(type: Setting['type'], bytes: Uint8Array): Setting { /* ... */ }
function encode(setting: Setting): Uint8Array { /* ... */ }
```

UI는 `Setting`만 압니다. 바이트를 모르고, 모델도 모릅니다. 신규 모델 대응은 타입을 추가하고 변환 분기를 넓히는 선에서 끝납니다.

## 레지스트리를 만들지 않은 이유

이런 구조를 보면 플러그인 레지스트리로 확장하고 싶어집니다. 타입 핸들러를 런타임에 등록하고, 새 모델은 코드 수정 없이 설정으로 추가하는 식입니다.

만들지 않았습니다. 타입 추가는 팀 내부에서만 발생하고 개수가 유한했습니다. 런타임 확장성은 **외부에서 타입이 들어올 때** 값어치가 있는데, 그런 요구가 없었습니다. 명시적 분기는 읽으면 전부 보이고, 레지스트리는 등록 시점을 추적해야 흐름이 보입니다.

## 지금이라면 고칠 것

변환 분기에서 신규 타입 처리를 빠뜨려도 빌드가 통과했습니다. 타입 개수가 적어 리뷰로 걸러진다고 봤는데, 모델이 늘면 결국 사람이 놓칩니다.

`never`를 이용한 exhaustiveness check를 넣으면 누락이 컴파일 에러로 드러납니다.

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(x)}`);
}

switch (setting.type) {
  case 'uint16': return /* ... */;
  case 'bool':   return /* ... */;
  case 'ascii':  return /* ... */;
  default: return assertNever(setting); // 타입 추가 시 여기서 컴파일 실패
}
```

일반적인 웹 앱이면 "값이 잘못 표시된다" 정도의 버그입니다. 여기서는 **잘못된 값이 물리 기기에 기록됩니다.** 복구 비용이 다르면 방어 수준도 달라야 합니다.

:::questions
- 잘못된 설정이 기기에 기록되는 걸 어떻게 막을 수 있나요?
:::

## 정리

- Web Serial은 사용자 제스처와 보안 컨텍스트를 전제로 브라우저에서 직접 시리얼 통신을 열어준다
- 통신보다 어려운 건 늘어나는 기기 모델을 흡수하는 구조다
- 바이너리 ↔ 도메인 값 변환은 UI 밖 한 곳에 모은다
- 확장성 구조는 외부 확장이 실제로 있을 때 만든다
- 되돌리기 어려운 쓰기 경로일수록 타입 시스템으로 먼저 막는다
