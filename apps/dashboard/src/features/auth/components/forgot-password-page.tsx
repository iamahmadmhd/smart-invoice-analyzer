import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { resetPassword } from 'aws-amplify/auth';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { Loader } from '@/components/ui/loader';

const schema = z.object({
    email: z.email('Enter a valid email'),
});

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<{ message: string | undefined } | undefined>(undefined);

    const form = useForm({
        defaultValues: { email: '' },
        validators: { onSubmit: schema },
        onSubmit: async ({ value }) => {
            setError(undefined);
            try {
                await resetPassword({ username: value.email });
                navigate({ to: '/reset-password', search: { email: value.email } });
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
            <div className='flex flex-col gap-6 glass-card'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-bold'>Forgot password</h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter your email to reset your password.
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

                    <FieldError errors={[error]} />

                    <form.Subscribe
                        selector={(s) => [s.canSubmit, s.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button
                                type='submit'
                                className='w-full'
                                disabled={!canSubmit}
                            >
                                {isSubmitting ? <Loader animateOnView /> : 'Send reset code'}
                            </Button>
                        )}
                    />
                </form>
            </div>
            <div className='flex items-center justify-center'>
                <Link
                    to='/signin'
                    className='text-sm'
                >
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
