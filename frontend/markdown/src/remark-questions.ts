import type { Root, RootContent, Text } from "mdast";
import type { ContainerDirective, LeafDirective, TextDirective } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

type Directive = ContainerDirective | LeafDirective | TextDirective;

/**
 * `:::questions` 블록을 <suggested-questions questions="[...]"> 요소로 바꾼다.
 * 그 밖의 지시문 문법은 쓰지 않으므로 원문 텍스트로 되돌린다(예: "시간:분" 표기 보호).
 */
export function remarkQuestions() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (!isDirective(node) || !parent || index === undefined) return;
      if (node.type === "containerDirective" && node.name === "questions") {
        const questions = node.children
          .filter((child) => child.type === "list")
          .flatMap((list) => list.children.map((item) => toString(item).trim()))
          .filter(Boolean);
        node.data = { hName: "suggested-questions", hProperties: { questions: JSON.stringify(questions) } };
        node.children = [];
        return;
      }
      if (node.type === "textDirective") {
        const replacement: RootContent[] = [{ type: "text", value: `:${node.name}` } satisfies Text, ...node.children];
        parent.children.splice(index, 1, ...(replacement as typeof parent.children));
        return index + replacement.length;
      }
      // 알 수 없는 블록 지시문은 내용만 남긴다.
      parent.children.splice(index, 1, ...(node.children as typeof parent.children));
      return index;
    });
  };
}

function isDirective(node: unknown): node is Directive {
  const type = (node as { type?: string }).type;
  return type === "containerDirective" || type === "leafDirective" || type === "textDirective";
}
