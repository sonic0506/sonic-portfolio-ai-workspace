'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ellipsis, MessageSquare, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { StoredConversation } from '@/lib/chat-store';

/** 사이드바의 대화 한 줄. 더보기는 hover·포커스·메뉴가 열린 동안에만 나온다. */
export function ConversationItem({
  conversation,
  active,
  onDelete,
}: {
  conversation: StoredConversation;
  active: boolean;
  onDelete: (conversation: StoredConversation) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={conversation.title} isActive={active}>
        <Link href={`/chat/${conversation.id}`}>
          <MessageSquare strokeWidth={1.5} />
          <span>{conversation.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label="대화 메뉴">
            <Ellipsis strokeWidth={1.5} />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-32">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 strokeWidth={1.5} />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 확인 알럿은 드롭다운 밖에 둔다. 메뉴가 닫히면서 같이 사라지지 않아야 한다. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>대화 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              ‘{conversation.title}’ 대화를 서버에서도 지웁니다.
              <br />
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">취소</AlertDialogCancel>
            <AlertDialogAction size="sm" variant="destructive" onClick={() => onDelete(conversation)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  );
}
