import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/$teamId/$section')({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/(app)/$section"!</div>;
}
