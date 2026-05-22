import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { fetchAuthSession, getCurrentUser, signIn } from 'aws-amplify/auth';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/ui/input-password';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/(auth)/signin')({
    component: SignInPage,
});

const schema = z.object({
    email: z.email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

function SignInPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [error, setError] = useState<{ message: string | undefined } | undefined>(undefined);

    const form = useForm({
        defaultValues: { email: '', password: '' },
        validators: {
            onSubmit: schema,
        },
        onSubmit: async ({ value }) => {
            setError(undefined);
            try {
                await signIn({ username: value.email, password: value.password });
                const cognitoUser = await getCurrentUser();
                const session = await fetchAuthSession();
                const claims = session.tokens?.idToken?.payload;
                setUser({
                    userId: cognitoUser.userId,
                    email: claims?.['email'] as string,
                    username: cognitoUser.username,
                });
                navigate({ to: '/' });
            } catch (e) {
                if (e instanceof Error) {
                    setError({ message: e.message });
                } else {
                    setError({ message: 'An unknown error occurred.' });
                }
            }
        },
    });

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-bold'>Welcome back</h1>
                    <p className='text-sm text-muted-foreground'>
                        Sign in to your account to continue
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <form.Field
                        name='email'
                        validators={{ onChange: schema.shape.email }}
                        children={(field) => (
                            <Field>
                                <Label htmlFor={field.name}>Email</Label>
                                <Input
                                    id={field.name}
                                    type='email'
                                    autoComplete='email'
                                    placeholder='you@company.com'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={!field.state.meta.isValid}
                                />
                                <FieldError errors={field.state.meta.errors} />
                            </Field>
                        )}
                    />

                    <form.Field
                        name='password'
                        validators={{ onChange: schema.shape.password }}
                        children={(field) => (
                            <Field>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor={field.name}>Password</Label>
                                    <Link
                                        to='/forgot-password'
                                        className='text-sm'
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <InputPassword
                                    id={field.name}
                                    name={field.name}
                                    autoComplete='current-password'
                                    placeholder='Your password'
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={!field.state.meta.isValid}
                                />
                                <FieldError errors={field.state.meta.errors} />
                            </Field>
                        )}
                    />

                    <FieldError errors={[error]} />

                    <form.Subscribe
                        selector={(s) => [s.canSubmit, s.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button
                                type='submit'
                                className='w-full'
                                disabled={!canSubmit}
                            >
                                {isSubmitting ? <Loader animateOnView /> : 'Sign in'}
                            </Button>
                        )}
                    />
                </form>

                <FieldDescription className='text-center'>
                    Don&apos;t have an account? <Link to='/signup'>Sign up</Link>
                </FieldDescription>
            </div>
        </div>
    );
}
