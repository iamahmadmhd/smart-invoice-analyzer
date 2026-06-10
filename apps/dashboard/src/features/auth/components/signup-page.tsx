import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { signUp } from 'aws-amplify/auth';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/ui/input-password';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { Link } from '@/components/ui/link';

const schema = z
    .object({
        email: z.email('Enter a valid email'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain an uppercase letter')
            .regex(/[0-9]/, 'Password must contain a number'),
        confirmPassword: z.string().min(8, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export function SignUpPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<{ message: string | undefined } | undefined>(undefined);

    const form = useForm({
        defaultValues: { email: '', password: '', confirmPassword: '' },
        validators: {
            onSubmit: schema,
        },
        onSubmit: async ({ value }) => {
            setError(undefined);
            try {
                const result = await signUp({
                    username: value.email,
                    password: value.password,
                    options: {
                        userAttributes: {
                            email: value.email,
                        },
                    },
                });
                if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                    navigate({ to: '/confirm', search: { email: value.email } });
                } else {
                    navigate({ to: '/' });
                }
            } catch (e) {
                if (e instanceof Error) {
                    setError({ message: e.message });
                } else {
                    setError({ message: 'An unknown error occurred' });
                }
            }
        },
    });

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-6 glass-card'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-bold'>Create account</h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter your details to get started
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
                                    name={field.name}
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
                        children={(field) => {
                            return (
                                <Field>
                                    <Label htmlFor={field.name}>Password</Label>
                                    <InputPassword
                                        id={field.name}
                                        name={field.name}
                                        autoComplete='new-password'
                                        placeholder='Min. 8 characters'
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={!field.state.meta.isValid}
                                    />
                                    <FieldError errors={field.state.meta.errors} />
                                </Field>
                            );
                        }}
                    />

                    <form.Field
                        name='confirmPassword'
                        validators={{ onChange: schema.shape.confirmPassword }}
                        children={(field) => {
                            return (
                                <Field>
                                    <Label htmlFor={field.name}>Confirm Password</Label>
                                    <InputPassword
                                        id={field.name}
                                        name={field.name}
                                        autoComplete='new-password'
                                        placeholder='Min. 8 characters'
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={!field.state.meta.isValid}
                                    />
                                    <FieldError errors={field.state.meta.errors} />
                                </Field>
                            );
                        }}
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
                                {isSubmitting ? <Loader animateOnView /> : 'Create account'}
                            </Button>
                        )}
                    />
                </form>
                <p className='text-center text-sm'>
                    Already have an account? <Link to='/signin'>Sign in</Link>
                </p>
            </div>

            <p className='text-center text-sm text-muted-foreground'>
                By clicking continue, you agree to our <Link to='/'>terms of service</Link> and{' '}
                <Link to='/'>privacy policy</Link>.
            </p>
        </div>
    );
}
