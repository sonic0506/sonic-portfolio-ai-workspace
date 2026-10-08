import type { Metadata } from "next";
import { MiniChatPrompt } from "@/components/molecules/mini-chat-prompt";
import { ProjectsView } from "@/components/organisms/projects-view";

export const metadata: Metadata = { title: "프로젝트" };

/** 셸은 정적이고 목록은 브라우저에서 받는다(ADR-0021). */
export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pt-10 pb-20 sm:px-10">
      <ProjectsView />
      <MiniChatPrompt
        label="어떤 작업이 궁금한지 물어보셔도 됩니다"
        placeholder="예: VIORA에서 처리 위치를 왜 나눴나요?"
        caption="프로젝트와 블로그 글에서 답을 찾습니다"
        className="mt-16"
      />
    </div>
  );
}
