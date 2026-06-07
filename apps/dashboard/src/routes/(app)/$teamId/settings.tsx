import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/$teamId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(app)/$teamId/settings"!</div>
}
