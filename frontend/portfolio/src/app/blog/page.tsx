import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Suspense } from "react";
import { MiniChatPrompt } from "@/components/molecules/mini-chat-prompt";
import { BlogSkeleton, BlogView } from "@/components/organisms/blog-view";
import { getCategories } from "@/lib/api";

export const metadata: Metadata = pageMetadata({ title: "블로그", description: "작업하며 내린 판단과 문제 해결, 공부한 기술을 정리한 글 목록입니다.", path: "/blog" });

/** 셸과 카테고리 이름은 정적이고(ISR), 조건별 목록은 브라우저에서 받는다(ADR-0021). */
export default async function BlogPage() {
  // 레이아웃과 같은 요청이라 한 번만 부른다.
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-content px-6 pt-10 pb-20 sm:px-10">
      <Suspense fallback={<BlogSkeleton />}>
        <BlogView categories={categories} />
      </Suspense>
      <MiniChatPrompt
        label="찾는 내용이 없다면 직접 물어보세요"
        placeholder="예: 모바일 웹에서 뒤로 가기를 어떻게 처리했나요?"
        caption="프로젝트와 블로그 글에서 답을 찾습니다"
        className="mt-16"
      />
    </div>
  );
}
