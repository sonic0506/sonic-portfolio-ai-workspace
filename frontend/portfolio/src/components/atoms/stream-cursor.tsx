const KEYFRAMES = 'stream-cursor-blink';

/** 스트리밍 중인 답변 끝에서 깜빡이는 커서. 악센트를 쓰는 몇 안 되는 자리다. */
export function StreamCursor() {
  return (
    <>
      <style href={KEYFRAMES} precedence="medium">
        {`@keyframes ${KEYFRAMES}{0%,49%{opacity:1}50%,100%{opacity:0}}`}
      </style>
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-accent"
        style={{ animation: `${KEYFRAMES} .8s step-end infinite` }}
      />
    </>
  );
}
