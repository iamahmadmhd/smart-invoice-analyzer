import { createFileRoute } from '@tanstack/react-router';
import { SignUpPage } from '@/features/auth';

export const Route = createFileRoute('/(auth)/signup')({
    component: SignUpPage,
});
