import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/(app)/')({ component: App });

function App() {
    const { user, signOut } = useAuthStore();

    return (
        <div className='flex min-h-svh p-6'>
            <div className='flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose'>
                <div>
                    <h1 className='font-medium'>Welcome!</h1>
                    <p>You are signed in as {user?.email}</p>
                    <Button
                        className='mt-2'
                        onClick={signOut}
                    >
                        Sign out
                    </Button>
                </div>
            </div>
        </div>
    );
}
