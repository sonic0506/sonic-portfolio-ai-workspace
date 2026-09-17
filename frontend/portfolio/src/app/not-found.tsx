import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-20 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">비공개로 바뀌었거나 주소가 잘못되었어요.</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        처음으로
      </Link>
    </div>
  );
}
