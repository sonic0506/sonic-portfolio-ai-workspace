import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '@/lib/api'
import { keys } from './content-queries'

/**
 * 생성은 POST 후 상세 화면으로 이동, 수정은 PUT 후 제자리.
 * 저장하면 색인이 다시 만들어지므로 색인 상태 목록도 새로 읽는다.
 */
export function useContentSave<Req, Res extends { id: number }>(opts: {
  basePath: string
  routePrefix: string
  id?: number
  listKey: readonly unknown[]
  detailKey: (id: number) => readonly unknown[]
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const mutation = useMutation({
    mutationFn: (body: Req) =>
      opts.id === undefined
        ? api<Res>(opts.basePath, { method: 'POST', body })
        : api<Res>(`${opts.basePath}/${opts.id}`, { method: 'PUT', body }),
    onMutate: () => setSaved(false),
    onSuccess: async (res) => {
      queryClient.setQueryData(opts.detailKey(res.id), res)
      invalidateOtherDetails(queryClient, opts.detailKey(res.id))
      await queryClient.invalidateQueries({ queryKey: opts.listKey, exact: true })
      void queryClient.invalidateQueries({ queryKey: keys.rag })
      setSaved(true)
      if (opts.id === undefined) navigate(`${opts.routePrefix}/${res.id}`, { replace: true })
    },
  })
  return { ...mutation, saved }
}

export function useContentDelete(opts: { basePath: string; id?: number; listKey: readonly unknown[]; after: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => api<void>(`${opts.basePath}/${opts.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      invalidateOtherDetails(queryClient)
      await queryClient.invalidateQueries({ queryKey: opts.listKey, exact: true })
      void queryClient.invalidateQueries({ queryKey: keys.rag })
      navigate(opts.after, { replace: true })
    },
  })
}

/**
 * 참고 문서는 상대 문서 상세의 "이 문서를 참고한 문서"에도 보이므로
 * 저장·삭제 후 다른 프로젝트·글 상세 캐시를 새로 읽게 한다.
 */
function invalidateOtherDetails(queryClient: QueryClient, except?: readonly unknown[]) {
  void queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      queryKey.length === 2 &&
      (queryKey[0] === keys.projects[0] || queryKey[0] === keys.posts[0]) &&
      !(except && queryKey[0] === except[0] && queryKey[1] === except[1]),
  })
}
