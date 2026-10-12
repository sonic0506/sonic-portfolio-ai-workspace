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
