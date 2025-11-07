import { AcceptInvitePage } from '@/components/sharing/accept-invite-page'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  
  return <AcceptInvitePage token={token} />
}