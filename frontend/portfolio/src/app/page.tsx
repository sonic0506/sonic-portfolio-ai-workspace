import { Fragment } from "react";
import { Mono } from "@/components/atoms/mono";
import { HomeScreen } from "@/components/organisms/home-screen";
import { getCategories, getProfileOrNull, getProjects } from "@/lib/api";

/** 짧은 소개를 문장 단위로 나눠 히어로 슬라이드로 쓴다. */
function sentences(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default async function HomePage() {
  const [profile, projects, categories] = await Promise.all([getProfileOrNull(), getProjects(), getCategories()]);
  const projectCount = projects.featured.length + projects.others.length;
  const postCount = categories.reduce((sum, c) => sum + c.postCount, 0);

  const slides = [
    ...sentences(profile?.shortBio).map((s) => [s]),
    [
      // 클라이언트 컴포넌트로 넘기는 요소 배열이라 key가 필요하다.
      <Fragment key="count">
        <Mono className="text-sm">{projectCount}</Mono>개의 프로젝트와 <Mono className="text-sm">{postCount}</Mono>건의 글로
        저를 소개합니다
      </Fragment>,
    ],
  ];

  return (
    <HomeScreen
      headline={profile?.headline ?? "개발자 포트폴리오"}
      slides={slides}
      projectCount={projectCount}
      postCount={postCount}
    />
  );
}
