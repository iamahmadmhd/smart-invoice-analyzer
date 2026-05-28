import { createFileRoute } from '@tanstack/react-router';
import { SignUpPage } from '@/components/auth/signup-page';

export const Route = createFileRoute('/(auth)/signup')({
    component: SignUpPage,
});
